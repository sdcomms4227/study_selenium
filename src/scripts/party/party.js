require('dotenv').config();
const {Builder, By, Key, until} = require('selenium-webdriver');
const { getChromeOptions, login, handleBookmark } = require('../../utils/utils');

// Define constants
const SEARCH_KEYWORD = "부산광역시 파티룸";
const FILTER_KEYWORDS = ['장소대여'];

const run = async () => {
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(getChromeOptions())
        .build();

    try {
        // Set window size
        await driver.manage().window().setRect({ width: 1920, height: 1080 });
        
        // Login to Naver
        await login(driver);
        console.log('네이버 로그인 완료');
       
        console.log('Starting map search process...');
        
        // 특정 URL 생성
        await driver.get('https://map.naver.com/');
        console.log('Loaded Naver Maps');
        
        let userAgent = await driver.executeScript("return navigator.userAgent;")
        console.log('[UserAgent]', userAgent);

        // Wait for the search input to be present
        await driver.wait(until.elementLocated(By.css('input.input_search')), 10000);
        console.log('Found search input');
        
        // Use JavaScript to input search term and trigger search
        let searchInput = await driver.findElement(By.css('input.input_search'));
        searchInput.sendKeys(SEARCH_KEYWORD, Key.ENTER);

        // Wait for search results
        await driver.sleep(2000);

        // Wait for and switch to search iframe
        await driver.wait(until.elementLocated(By.css('#searchIframe')), 10000);
        const searchFrame = await driver.findElement(By.css('#searchIframe'));
        await driver.switchTo().frame(searchFrame);
        console.log('Switched to search iframe');

        // Wait for the list container
        await driver.wait(until.elementLocated(By.css('#_pcmap_list_scroll_container')), 10000);
        
        let processedItems = new Set(); // Keep track of processed items
        let hasMoreItems = true;
        let currentPage = 1;

        while (hasMoreItems) {
            try {
                // Check if session is still valid
                try {
                    await driver.getCurrentUrl();
                } catch (sessionErr) {
                    console.log('Session lost, attempting to recover...');
                    // Recreate driver
                    driver = await new Builder()
                        .forBrowser('chrome')
                        .setChromeOptions(getChromeOptions())
                        .build();
                    
                    // Re-login
                    await login(driver);
                    
                    // Return to map page
                    await driver.get('https://map.naver.com/');
                    await driver.sleep(2000);
                    
                    // Re-search
                    const searchInput = await driver.findElement(By.css('input.input_search'));
                    searchInput.sendKeys(SEARCH_KEYWORD, Key.ENTER);
                    await driver.sleep(2000);
                    
                    // Re-switch to search frame
                    const searchFrame = await driver.findElement(By.css('#searchIframe'));
                    await driver.switchTo().frame(searchFrame);
                    console.log('Session recovered and search restarted');
                }

                console.log(`\nProcessing page ${currentPage}`);
                
                // Scroll through current page to trigger lazy loading
                let lastResultCount = 0;
                let sameCountTimes = 0;
                
                while (sameCountTimes < 3) { // Stop if count doesn't change after 3 attempts
                    // Scroll to bottom of container with a more reliable method
                    await driver.executeScript(`
                        const container = document.querySelector('#_pcmap_list_scroll_container');
                        if (container) {
                            // Scroll to bottom
                            container.scrollTo({
                                top: container.scrollHeight,
                                behavior: 'smooth'
                            });
                            // Force scroll to bottom
                            container.scrollTop = container.scrollHeight;
                            // Additional scroll to ensure bottom
                            container.scrollTo(0, container.scrollHeight);
                        }
                    `);
                    
                    // Wait longer for lazy loading
                    await driver.sleep(2000);
                    
                    // Get current result count
                    const resultElements = await driver.findElements(By.css('#_pcmap_list_scroll_container > ul > li'));
                    console.log('Current results count:', resultElements.length);
                    
                    if (resultElements.length === lastResultCount) {
                        sameCountTimes++;
                        console.log(`No new items loaded. Attempt ${sameCountTimes}/3`);
                    } else {
                        lastResultCount = resultElements.length;
                        sameCountTimes = 0;
                        console.log(`New items loaded. Total: ${lastResultCount}`);
                    }
                }

                // Process all items on current page
                const resultElements = await driver.findElements(By.css('#_pcmap_list_scroll_container > ul > li'));
                
                for (let i = 0; i < resultElements.length; i++) {
                    try {
                        // Re-find elements to avoid stale element reference
                        const currentElements = await driver.findElements(By.css('#_pcmap_list_scroll_container > ul > li'));
                        const element = currentElements[i];
                        
                        // Get unique identifier for the item (title + index)
                        const titleElement1 = await element.findElement(By.css('.place_bluelink > span:nth-child(1)'));
                        const titleElement2 = await element.findElement(By.css('.place_bluelink > span:last-child'));
                        const titleText1 = await titleElement1.getText();
                        const titleText2 = await titleElement2.getText();
                        const itemId = `${titleText1}_${titleText2}`;
                        
                        // Skip if already processed
                        if (processedItems.has(itemId)) {
                            console.log(`Skipping already processed item: ${titleText1}`);
                            continue;
                        }
                        
                        console.log(`========= Item ${i + 1} text:`, titleText1, " / ", titleText2); 

                        // Wait for 1 second between iterations
                        await driver.sleep(1000);
                        
                        // Only process items containing '파티룸'
                        if (FILTER_KEYWORDS.some(keyword => titleText2.includes(keyword))) {
                            console.log(`Processing party room item ${i + 1}:`, titleText1);
                            
                            // Find and click the div element
                            await element.findElement(By.css('div.place_bluelink')).click();
                            console.log('Clicked on party room item');
                            
                            // Wait for 1 second between iterations
                            await driver.sleep(1000);

                            // Switch back to default content for detail view
                            await driver.switchTo().defaultContent();
                            
                            // Wait for and switch to entry iframe
                            await driver.wait(until.elementLocated(By.css('#entryIframe')), 10000);
                            const detailFrame = await driver.findElement(By.css('#entryIframe'));
                            await driver.switchTo().frame(detailFrame);
                            
                            // Wait for detail content to load
                            await driver.sleep(1000);
                            
                            // Get detailed information
                            try {
                                await handleBookmark(driver, SEARCH_KEYWORD);
                            } catch (detailErr) {
                                console.log('Error getting details:', detailErr.message);
                            }

                            // Add to processed items
                            processedItems.add(itemId);
                        }
                        
                        // Switch back to search frame for next iteration
                        await driver.switchTo().defaultContent();
                        await driver.switchTo().frame(searchFrame);
                        await driver.sleep(1000);
                        
                    } catch (err) {
                        console.log('Error processing element:', err.message);
                        await driver.switchTo().defaultContent();
                        await driver.switchTo().frame(searchFrame);
                        continue;
                    }
                }

                // Check pagination navigation
                const paginationContainer = await driver.findElement(By.css('div.zRM9F'));
                const nextPageButton = await paginationContainer.findElement(By.css('a.eUTV2:last-child'));
                
                // Get all page numbers
                const pageNumbers = await paginationContainer.findElements(By.css('a.mBN2s'));
                const currentPageNumber = await pageNumbers[currentPage - 1].getText();
                console.log('Current page number:', currentPageNumber);

                // Check if we can go to next page
                const isNextEnabled = await nextPageButton.getAttribute('aria-disabled') !== 'true';
                
                if (isNextEnabled) {
                    // Click next page button
                    await nextPageButton.click();
                    console.log('Clicked next page');
                    await driver.sleep(2000); // Wait for page load
                    currentPage++;
                } else {
                    console.log('No more pages available');
                    hasMoreItems = false;
                }

            } catch (pageErr) {
                console.log('Error processing page:', pageErr.message);
                
                // Check if it's a session error
                if (pageErr.message.includes('invalid session id') || pageErr.message.includes('not connected to DevTools')) {
                    console.log('Session error detected, attempting to recover...');
                    try {
                        // Recreate driver
                        driver = await new Builder()
                            .forBrowser('chrome')
                            .setChromeOptions(getChromeOptions())
                            .build();
                        
                        // Re-login
                        await login(driver);
                        
                        // Return to map page
                        await driver.get('https://map.naver.com/');
                        await driver.sleep(2000);
                        
                        // Re-search
                        const searchInput = await driver.findElement(By.css('input.input_search'));
                        searchInput.sendKeys(SEARCH_KEYWORD, Key.ENTER);
                        await driver.sleep(2000);
                        
                        // Re-switch to search frame
                        const searchFrame = await driver.findElement(By.css('#searchIframe'));
                        await driver.switchTo().frame(searchFrame);
                        console.log('Session recovered and search restarted');
                        
                        // Continue with next iteration
                        continue;
                    } catch (recoveryErr) {
                        console.log('Failed to recover session:', recoveryErr.message);
                        hasMoreItems = false;
                    }
                } else {
                    hasMoreItems = false;
                }
            }
        }

        await driver.switchTo().defaultContent();
        console.log('\nSearch process completed');
    }
    catch(e){
        console.log(e);
    }
    finally {
        driver.quit();
    }
}
run(); 
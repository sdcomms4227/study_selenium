const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Common Chrome options setup
function getChromeOptions() {
    const options = new chrome.Options();
    
    // Add anti-detection measures
    options.addArguments(
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1920,1080',
        '--lang=ko_KR',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox'
    );
    
    // Set user agent
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // Exclude automation flags
    options.excludeSwitches(['enable-automation', 'enable-logging']);
    options.setUserPreferences({
        'credentials_enable_service': false,
        'profile.password_manager_enabled': false,
        'profile.default_content_setting_values.notifications': 2
    });

    return options;
}

// Common login function
async function login(driver, naverId, naverPw) {
    console.log('Starting login process...');
    
    // First visit Naver main page
    await driver.get('https://www.naver.com');
    await driver.sleep(Math.random() * 1000 + 1000);

    // Override navigator.webdriver
    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    
    // Then go to login page
    await driver.get('https://nid.naver.com/nidlogin.login');
    console.log('Loaded Naver login page');
    
    // Random delay before starting login
    await driver.sleep(Math.random() * 1000 + 1000);
    
    // Wait for login form
    await driver.wait(until.elementLocated(By.css('#id')), 10000);
    
    // Override navigator.webdriver again after page load
    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    
    // Inject credentials using JavaScript
    await driver.executeScript(`
        document.querySelector('#id').value = '${naverId}';
        document.querySelector('#id').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#pw').value = '${naverPw}';
        document.querySelector('#pw').dispatchEvent(new Event('input', { bubbles: true }));
    `);
    
    // Random delay before clicking login
    await driver.sleep(Math.random() * 1000 + 500);
    
    // Click login button using JavaScript
    await driver.executeScript(`
        document.querySelector('.btn_login').click();
    `);
    console.log('Clicked login button');
    
    // Longer wait for login process
    await driver.sleep(3000);

    // Wait for login form
    await driver.wait(until.elementLocated(By.css('#id')), 10000);
    
    // Inject credentials using JavaScript
    await driver.executeScript(`
        document.querySelector('#id').value = '${naverId}';
        document.querySelector('#id').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#pw').value = '${naverPw}';
        document.querySelector('#pw').dispatchEvent(new Event('input', { bubbles: true }));
    `);

    // 캡차 클릭
    await driver.findElement(By.css('#captcha')).click();

    // Longer wait for login process
    await driver.sleep(30000);

    // Check for login errors or success
    try {
        // Check for error messages
        const errorElements = await driver.findElements(By.css('.error_message'));
        for (const errorElement of errorElements) {
            const errorText = await errorElement.getText();
            if (errorText) {
                console.error('Login error:', errorText);
                await driver.quit();
                process.exit(1);
            }
        }

        // Check if we're still on the login page
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('nidlogin.login')) {
            console.error('Still on login page. Login might have failed.');
            await driver.quit();
            process.exit(1);
        }

        // Additional check for 2FA or security checks
        if (currentUrl.includes('nid.naver.com/login/ext/deviceConfirm')) {
            console.log('2FA or additional security check required. Please complete it manually.');
            // Wait longer for manual intervention if needed
            await driver.sleep(15000);
        }

        console.log('Login successful');
        
    } catch (loginError) {
        console.error('Error during login:', loginError.message);
        await driver.quit();
        process.exit(1);
    }
}

// Common bookmark handling function
async function handleBookmark(driver, searchKeyword, groupExists) {
    // Wait for and find the bookmark button
    await driver.wait(until.elementLocated(By.css('a.D_Xqt[href="#bookmark"]')), 10000);
    const bookmarkButton = await driver.findElement(By.css('a.D_Xqt[href="#bookmark"]'));
    
    // Click bookmark button
    await bookmarkButton.click();
    console.log('Clicked bookmark button');
    
    // Wait for bookmark dialog
    await driver.sleep(1000);

    if (!groupExists) {
        // Check if group exists in detail frame
        const currentGroups = await driver.findElements(By.css('.swt-save-group-item'));
        for (const group of currentGroups) {
            const groupText = await group.getText();
            if (groupText.includes(searchKeyword)) {
                groupExists = true;
                // Check if group is already checked by looking at the button's aria-checked
                const groupButton = await group.findElement(By.css('button[role="checkbox"]'));
                const isChecked = await groupButton.getAttribute('aria-checked') === 'true';
                
                if (!isChecked) {
                    await groupButton.click();
                    console.log('Clicked existing group:', searchKeyword);
                } else {
                    console.log('Group is already checked, skipping...');
                }
                break;
            }
        }
    }

    if (!groupExists) {
        // Create new group
        await driver.findElement(By.css('.swt-save-group-add-btn')).click();
        await driver.sleep(1000);

        // Input new group name
        const groupInput = await driver.findElement(By.css('input.swt-input-text'));
        await groupInput.clear();
        await groupInput.sendKeys(searchKeyword);
        
        // Click complete button to create group
        await driver.findElement(By.css('button.swt-complete-btn')).click();
        console.log('Created new bookmark group:', searchKeyword);

        // Wait for the new group to be created and appear in the list
        await driver.sleep(1000);
        
        // Find and click the newly created group
        const newGroups = await driver.findElements(By.css('.swt-save-group-item'));
        for (const group of newGroups) {
            const groupText = await group.getText();
            if (groupText.includes(searchKeyword)) {
                groupExists = true;
                // Check if group is already checked by looking at the button's aria-checked
                const groupButton = await group.findElement(By.css('button[role="checkbox"]'));
                const isChecked = await groupButton.getAttribute('aria-checked') === 'true';
                
                if (!isChecked) {
                    await groupButton.click();
                    console.log('Selected newly created group:', searchKeyword);
                } else {
                    console.log('Group is already checked, skipping...');
                }
                
                break;
            }
        }
    }

    // Wait for a moment before clicking save
    await driver.sleep(1000);

    // Click the save button
    await driver.findElement(By.css('.swt-save-btn')).click();
    console.log('Clicked save button');

    // Wait for save to complete
    await driver.sleep(1000);

    return groupExists;
}

module.exports = {
    getChromeOptions,
    login,
    handleBookmark
}; 
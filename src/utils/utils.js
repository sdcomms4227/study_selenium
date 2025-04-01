const {By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

// Chrome 옵션 설정
function getChromeOptions() {
    const options = new chrome.Options();
    
    // 기본 옵션
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-infobars');
    options.addArguments('--disable-notifications');
    options.addArguments('--disable-popup-blocking');
    options.addArguments('--disable-save-password-bubble');
    options.addArguments('--disable-translate');
    options.addArguments('--disable-web-security');
    options.addArguments('--ignore-certificate-errors');
    options.addArguments('--start-maximized');
    options.addArguments('--window-size=1920,1080');
    
    // 포어그라운드/백그라운드 모드에 따라 headless 옵션 설정
    if (process.env.CHROME_MODE === 'background') {
        options.addArguments('--headless');
    }
    
    return options;
}

// Common login function
async function login(driver) {
    console.log('Starting login process...');
    
    try {
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
        
        // Inject credentials using JavaScript with more robust approach
        await driver.executeScript(`
            // ID 입력
            var idElement = document.querySelector('#id');
            idElement.value = '${process.env.NAVER_ID}';
            idElement.dispatchEvent(new Event('input', { bubbles: true }));
            idElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            // PW 입력
            var pwElement = document.querySelector('#pw');
            pwElement.value = '${process.env.NAVER_PW}';
            pwElement.dispatchEvent(new Event('input', { bubbles: true }));
            pwElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            // 추가 이벤트 발생
            idElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
            pwElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
        `);
        
        // Random delay before clicking login
        await driver.sleep(Math.random() * 1000 + 500);
        
        // Click login button using JavaScript with multiple approaches
        try {
            // 첫 번째 방법: 직접 클릭
            await driver.executeScript(`
                document.querySelector('.btn_login').click();
            `);
        } catch (error) {
            // 두 번째 방법: 이벤트 발생
            await driver.executeScript(`
                var loginButton = document.querySelector('.btn_login');
                var clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                loginButton.dispatchEvent(clickEvent);
            `);
        }
        
        console.log('Clicked login button');
        
        // Longer wait for login process
        await driver.sleep(5000);

        // Check if we've been redirected away from login page (successful login)
        try {
            const currentUrl = await driver.getCurrentUrl();
            
            if (!currentUrl.includes('nidlogin.login')) {
                console.log('Login successful');
                return;
            }
        } catch (e) {
            // If checking URL fails, proceed with manual login attempt
            console.log('Could not verify redirect, proceeding with manual login');
        }

        // Try captcha click approach if we're still on login page
        try {
            // Wait for login form elements to be present
            await driver.wait(until.elementLocated(By.css('#id')), 10000);
            
            // Re-inject credentials with more robust approach
            await driver.executeScript(`
                // ID 재입력
                var idElement = document.querySelector('#id');
                idElement.value = '${process.env.NAVER_ID}';
                idElement.dispatchEvent(new Event('input', { bubbles: true }));
                idElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                // PW 재입력
                var pwElement = document.querySelector('#pw');
                pwElement.value = '${process.env.NAVER_PW}';
                pwElement.dispatchEvent(new Event('input', { bubbles: true }));
                pwElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 추가 이벤트 발생
                idElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
                pwElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
            `);

            // Attempt to click captcha if present
            try {
                await driver.findElement(By.css('#captcha')).click();
                console.log('Clicked captcha, waiting for manual intervention');
            } catch(captchaErr) {
                console.log('No captcha found or could not click it');
            }

            // Wait for manual login to complete
            await driver.sleep(30000);

            // Check for login success
            const postLoginUrl = await driver.getCurrentUrl();
            if (!postLoginUrl.includes('nidlogin.login')) {
                console.log('Login successful');
            } else {
                console.error('Still on login page after wait, manual intervention may be required');
            }
        } catch (formErr) {
            console.log('Login form interaction error:', formErr.message);
        }

        // 최종 로그인 상태 검증
        const finalUrl = await driver.getCurrentUrl();
        if (finalUrl.includes('nidlogin.login')) {
            console.error('로그인 실패: 로그인 페이지에 머물러 있습니다.');
            try {
                await driver.quit();
            } catch (quitError) {
                console.error('브라우저 종료 중 오류:', quitError.message);
            }
            console.error('스크립트를 중지합니다.');
            process.exit(1);
        }

        // 로그인 상태 추가 검증
        try {
            // 네이버 메인 페이지로 이동
            await driver.get('https://www.naver.com');
            await driver.sleep(2000);

            // 로그인 상태 확인 (예: 프로필 이미지나 닉네임 요소 확인)
            const profileElement = await driver.findElement(By.css('[class^="MyView-module__my_info"]'));
            if (!profileElement) {
                console.error('로그인 실패: 프로필 정보를 찾을 수 없습니다.');
                try {
                    await driver.quit();
                } catch (quitError) {
                    console.error('브라우저 종료 중 오류:', quitError.message);
                }
                console.error('스크립트를 중지합니다.');
                process.exit(1);
            }

            console.log('네이버 로그인 완료');
        } catch (error) {
            console.error('로그인 실패: 프로필 정보를 확인할 수 없습니다.');
            try {
                await driver.quit();
            } catch (quitError) {
                console.error('브라우저 종료 중 오류:', quitError.message);
            }
            console.error('스크립트를 중지합니다.');
            process.exit(1);
        }
    } catch (outerError) {
        if (outerError.message.includes('no such window') || outerError.message.includes('target window already closed')) {
            console.error('Browser window was closed, cannot complete login');
            throw outerError;
        }
        console.error('Unexpected error during login:', outerError.message);
        try {
            await driver.quit();
        } catch (quitError) {
            console.error('브라우저 종료 중 오류:', quitError.message);
        }
        throw outerError;
    }
}

const waitForElement = async (driver, selector, timeout = 10000) => {
    try {
        const element = await driver.wait(until.elementLocated(By.css(selector)), timeout);
        return element;
    } catch (error) {
        console.error(`[오류] 요소를 찾을 수 없습니다: ${selector}`);
        try {
            await driver.quit();
        } catch (quitError) {
            console.error('브라우저 종료 중 오류:', quitError.message);
        }
        console.error('스크립트를 중지합니다.');
        process.exit(1);
    }
};

/**
 * 북마크 처리 함수
 * @param {WebDriver} driver - Selenium WebDriver 인스턴스
 * @param {string} searchKeyword - 검색 키워드
 * @returns {Promise<void>}
 */
async function handleBookmark(driver, searchKeyword) {
    try {
        // 북마크 버튼 찾기
        const bookmarkButton = await waitForElement(driver, 'a.D_Xqt[href="#bookmark"]');
        
        // 북마크 상태 확인
        const isBookmarked = await bookmarkButton.getAttribute('aria-pressed') === 'true';
        if (isBookmarked) {
            console.log('이미 북마크된 항목입니다.');
            return;
        }

        // 북마크 버튼 클릭
        await bookmarkButton.click();
        await driver.sleep(1000);

        // 북마크 그룹 목록 가져오기
        const bookmarkGroups = await driver.findElements(By.css('li.swt-save-group-item'));
        
        // 필터 키워드로 북마크 그룹 찾기
        let targetGroup = null;
        for (const group of bookmarkGroups) {
            const groupName = await group.findElement(By.css('strong.swt-save-group-name')).getText();
            if (groupName.includes(searchKeyword)) {
                targetGroup = group;
                break;
            }
        }

        // 북마크 그룹이 없으면 생성
        if (!targetGroup) {
            console.log('북마크 그룹이 없습니다. 새로운 그룹을 생성합니다...');
            
            // 북마크 그룹 생성 버튼 클릭
            const createGroupButton = await waitForElement(driver, 'button.swt-save-group-add-btn');
            await createGroupButton.click();
            await driver.sleep(1000);

            // 그룹 이름 입력
            const groupNameInput = await waitForElement(driver, 'input.swt-input-text[title="새 리스트명"]');
            await groupNameInput.sendKeys(searchKeyword);
            await driver.sleep(1000);

            // 완료 버튼 클릭
            const completeButton = await waitForElement(driver, 'button.swt-complete-btn');
            await completeButton.click();
            await driver.sleep(1000);
        } else {
            // 기존 그룹이 있는 경우에만 선택
            const groupButton = await targetGroup.findElement(By.css('button.swt-save-group-info'));
            await groupButton.click();
            await driver.sleep(1000);
        }

        // 저장 버튼 클릭
        const saveButton = await waitForElement(driver, 'button.swt-save-btn');
        await saveButton.click();
        await driver.sleep(1000);

        console.log('북마크 처리 완료');
    } catch (err) {
        console.log('북마크 처리 중 오류 발생:', err.message);
        throw err;
    }
}

module.exports = {
    waitForElement,
    getChromeOptions,
    login,
    handleBookmark
}; 
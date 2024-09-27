function getRepoInfo() {
    const metaElement = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
    if (metaElement) {
        return metaElement.getAttribute('content');
    }

    const urlParts = window.location.pathname.split('/');
    if (urlParts.length >= 3) {
        return `${urlParts[1]}/${urlParts[2]}`;
    }

    throw new Error('Could not find repo info');
}

function generatePRLink() {
    try {
        console.log('Generating PR link...');
        
        const titleElement = document.querySelector('.js-issue-title');
        console.log('Title element:', titleElement);
        
        const authorElement = document.querySelector('.author');
        console.log('Author element:', authorElement);
        
        const numberElement = document.querySelector('.gh-header-number');
        console.log('Number element:', numberElement);

        if (!titleElement || !authorElement || !numberElement) {
            throw new Error('Could not find required PR elements');
        }

        const title = titleElement.textContent.trim();
        const author = authorElement.textContent.trim();
        const prNumber = numberElement.textContent.trim();
        const repoInfo = getRepoInfo();

        console.log('Generated info:', { title, author, prNumber, repoInfo });

        const richLink = `<a href="${window.location.href}">${title} by ${author} · ${prNumber} · ${repoInfo}</a>`;
        console.log('Rich link:', richLink);

        return { richLink, plainText: `${title} by ${author} · ${prNumber} · ${repoInfo}` };
    } catch (error) {
        console.error('Error generating PR link:', error);
        throw error;
    }
}

function copyToClipboard(richLink, plainText) {
    if (navigator.clipboard && navigator.clipboard.write) {
        const blob = new Blob([richLink], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        
        return navigator.clipboard.write([clipboardItem])
            .then(() => 'Rich text link copied to clipboard!')
            .catch(err => {
                console.error('Failed to copy rich text:', err);
                return navigator.clipboard.writeText(plainText)
                    .then(() => 'Plain text link copied to clipboard.')
                    .catch(err => {
                        console.error('Failed to copy plain text:', err);
                        throw new Error('Failed to copy. Please copy manually.');
                    });
            });
    } else {
        return navigator.clipboard.writeText(plainText)
            .then(() => 'Plain text link copied to clipboard.')
            .catch(err => {
                console.error('Failed to copy text:', err);
                throw new Error('Failed to copy. Please copy manually.');
            });
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #0366d6;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999;
        transition: opacity 0.5s;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}


function handleButtonClick() {
    showNotification('Generating PR link...');
    try {
        const { richLink, plainText } = generatePRLink();
        copyToClipboard(richLink, plainText)
            .then(message => showNotification(message))
            .catch(error => showNotification(error.message));
    } catch (error) {
        showNotification('An error occurred: ' + error.message);
    }
}

// 创建并添加按钮
function addButton() {
    const headerActions = document.querySelector('.gh-header-actions');
    if (headerActions && !document.getElementById('copy-pr-link-btn')) {
        const button = document.createElement('button');
        button.id = 'copy-pr-link-btn';
        button.className = 'btn btn-sm';
        button.textContent = 'Copy PR Link';
        button.addEventListener('click', handleButtonClick);
        headerActions.prepend(button);
        console.log('Button added successfully');
    } else {
        console.log('Header actions not found or button already exists');
    }
}

function checkAndAddButton() {
    if (window.location.pathname.includes('/pull/')) {
        const maxAttempts = 10;
        let attempts = 0;

        function tryAddButton() {
            if (attempts >= maxAttempts) {
                console.log('Max attempts reached. Button not added.');
                return;
            }

            if (!document.getElementById('copy-pr-link-btn')) {
                addButton();
                if (!document.getElementById('copy-pr-link-btn')) {
                    attempts++;
                    setTimeout(tryAddButton, 1000);
                }
            }
        }

        tryAddButton();
    }
}

// Use MutationObserver to detect page changes
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            checkAndAddButton();
        }
    }
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });

// Initial check when the script loads
checkAndAddButton();

// Listen for URL changes (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkAndAddButton();
    }
}).observe(document, { subtree: true, childList: true });

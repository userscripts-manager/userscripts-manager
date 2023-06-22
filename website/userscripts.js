/**
 * A promise that is resolved when the html DOM is ready. 
 * Should be part of any browser, but is not.
 * 
 * @type {Promise<void>} A promise that is resolved when the html DOM is ready
 */
const readyPromise = new Promise((resolve, reject) => {
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        setTimeout(() => resolve(), 1);
    } else {
        const onContentLoaded = () => {
            resolve();
            document.removeEventListener('DOMContentLoaded', onContentLoaded, false);
        }
        document.addEventListener('DOMContentLoaded', onContentLoaded, false);
    }
})

/**
 * Add a new css string to the page
 * 
 * @param {string} styleText The CSS string to pass
 * @returns {void}
 */
const addStyle = (() => {
    let styleElement = null;
    let styleContent = null;

    /**
     * Add a new css string to the page
     * 
     * @param {string} styleText The CSS string to pass
     * @returns {void}
     */
    return (styleText) => {
        if (styleElement === null) {
            styleElement = document.createElement('style');
            styleContent = "";
            document.head.appendChild(styleElement);
        } else {
            styleContent += "\n";
        }

        styleContent += styleText;
        styleElement.textContent = styleContent;
    };
})();

/**
 * Fetch a json filename content without using cache
 * 
 * @param {string} filename The JSON filename
 * @returns The filename content as a javascript object
 */
const getJson = async (filename) => {
    const response = await fetch(`${filename}?${(new Date()).getTime()}`);
    return await response.json();
}

/**
 * Get scripts infos
 * @returns {Promise<{[path: string]: {[property: string]:string}[]}>}
 */
const getUserscripts = async () => {
    // return { "twitch/twitch-auto-click.user.js": [["name", "twitch-auto-click"], ["namespace", "http://github.com/gissehel/userscripts"], ["version", "1.0.8"], ["description", "twitch-auto-click"], ["author", "gissehel"], ["match", "https://twitch.tv/*"], ["match", "https://www.twitch.tv/*"], ["grant", "none"]], "twitch/twitch-picture-in-picture.user.js": [["name", "twitch-picture-in-picture"], ["namespace", "http://github.com/gissehel/userscripts"], ["version", "1.0.0.8"], ["description", "twitch-picture-in-picture"], ["author", "gissehel"], ["match", "https://twitch.tv/*"], ["match", "https://www.twitch.tv/*"], ["grant", "none"]], "twitter/twitter-image-downloader.user.js": [["name", "twitter-image-downloader"], ["namespace", "http://github.com/gissehel/userscripts"], ["version", "1.4.7"], ["description", "Twitter image/video downloader"], ["author", "gissehel"], ["match", "https://twitter.com/*"], ["grant", "none"]], "twitter/twittervideodownloader-easy.user.js": [["name", "twittervideodownloader-easy"], ["namespace", "http://tampermonkey.net/"], ["version", "1.2.4"], ["description", "twittervideodownloader.com easy"], ["author", "gissehel"], ["match", "http://twittervideodownloader.com/*"], ["match", "https://twittervideodownloader.com/*"], ["grant", "none"]] };
    return await getJson('userscripts.json')
}

/**
 * Get site version
 * @returns {Promise<string>}
 */
const getVersion = async () => {
    // return "dev";
    return (await getJson('version.json')).version
}

/**
 * Create an HTMLElement using various properties 
 * @param {string} name
 * @param {object} obj
 * @param {HTMLElement} obj.parent
 * @param {string[]} obj.classNames
 * @param {string} obj.text
 * @param {HTMLElement[]} obj.children
 * @param {{[name: string]: string}} obj.properties
 * @param {(HTMLElement)=>void} obj.onCreated
 * @returns {HTMLElement}
 */
const createElement = (name, { parent, classNames, text, children, properties, onCreated }) => {
    const element = document.createElement(name);
    if (parent) {
        parent.appendChild(element);
    }
    if (classNames) {
        classNames.forEach((className) => element.classList.add(className))
    }
    if (text) {
        element.textContent = text;
    }
    const appendChild = (child) => {
        if (child) {
            if (child instanceof Array) {
                child.forEach((c) => appendChild(c))
            } else if (child instanceof HTMLElement) {
                element.appendChild(child)
            }
        }
    }
    if (children) {
        appendChild(children)
    }
    if (properties) {
        Object.keys(properties).forEach((property) => element.setAttribute(property, properties[property]))
    }
    if (onCreated) {
        onCreated(element);
    }
    return element;
}

/**
 * Get a property from the userscript structure
 * @param {{[property: string]:string}[]} userscripts The userscript data structure
 * @param {string} name The name of the property
 * @param {string} defaultValue The default value when no value has been found
 * @return {string}
 */
const getProperty = (userscript, name, defaultValue) => {
    const properties = userscript.filter(([property]) => property === name);
    if (properties.length >= 0) {
        return properties[0][1];
    } else {
        return defaultValue;
    }
}

/**
 * Create a page given a userscripts structure
 * @param {{[path: string]: {[property: string]:string}[]}} userscripts 
 * @param {string} version
 */
const createPage = (userscripts, version) => {
    addStyle('table { width: 100% }')
    addStyle('th,td { padding: 0.6em; }')
    addStyle('th,td,p,div,span,h1,h2,h3,body { font-family: "Calibri","sans-serif"; }')
    addStyle('.version { font-size: 0.5em }')

    sectionInfos = [
        { sectionName: 'Userscripts', column: 'Script name', filterType: 'script' },
        { sectionName: 'Userstyles', column: 'Style name', filterType: 'style' },
    ]

    createElement('title', { parent: document.head, text: 'Userscripts' });

    createElement('header', {
        parent: document.body,
        classNames: ['page-header'],
    })
    createElement('table', {
        parent: document.body,
        children: [
            ...sectionInfos.map((sectionInfo) => {
                const { sectionName, column, filterType } = sectionInfo;

                const paths = Object.keys(userscripts).filter((path) => userscripts[path].filter((kv) => kv[0] === 'type')[0][1] === filterType)

                return [
                    createElement('tr', {
                        classNames: ['title-line'],
                        children: [
                            createElement('td', {
                                classNames: ['title-cell'],
                                properties: {
                                    colSpan: '3'
                                },
                                children: [
                                    createElement('h1', {
                                        classNames: ['title-content'],
                                        text: `${sectionName} `, children: [
                                            createElement('span', { text: `(Version: ${version})`, classNames: ['version'] })
                                        ]
                                    })
                                ]
                            }),
                        ]
                    }),
                    createElement('tr', {
                        classNames: ['header-line'],
                        children: [
                            createElement('th', { text: column, classNames: ['header-cell'], }),
                            createElement('th', { text: 'Link', classNames: ['header-cell'], }),
                            createElement('th', { text: 'version', classNames: ['header-cell'], }),
                        ]
                    }),
                    ...paths.map((path) => createElement('tr', {
                        classNames: ['data-line'],
                        children: [
                            createElement('td', { text: getProperty(userscripts[path], 'name', '-'), classNames: ['data-cell', 'name-cell' ], }),
                            createElement('td', {
                                children: [
                                    createElement('a', { text: path, properties: { href: path } })
                                ],
                                classNames: ['data-cell', 'link-cell'],
                            }),
                            createElement('td', { text: getProperty(userscripts[path], 'version', '-'), classNames: ['data-cell', 'version-cell' ], }),
                        ]
                    }))
                ]
            }),
        ]
    })
    createElement('footer', {
        parent: document.body,
        classNames: ['page-footer'],
    })
}

const start = async () => {
    const version = await getVersion();
    const userscripts = await getUserscripts();
    createPage(userscripts, version);
};

readyPromise.then(start);
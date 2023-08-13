const fs = require('fs/promises')

const propsTable = ['grant', 'antifeature', 'require', 'resource', 'include', 'match', 'connect']
keyOrders = ['name', 'namespace', 'version', 'description', 'author', 'homepage', 'supportURL', 'match', 'icon', 'grant']

const display = (obj, ...objs) => {
    result = JSON.stringify(obj, null, 4)
    if (objs !== undefined) {
        for (const obj of objs) {
            result += ' ' + (JSON.stringify(obj, null, 0))
        }
    }
    console.log(result)
}

const isDir = async (path) => {
    try {
        const stat = await fs.stat(path)
        return stat.isDirectory()
    } catch (e) {
        return false
    }
}
const makedirs = async (path) => await fs.mkdir(path, { recursive: true })
const open = async (path, flags) => await fs.open(path, flags)
const write = async (handle, data) => await handle.write(data)
const writeLine = async (handle, data) => await write(handle, data + '\n')
const close = async (handle) => await handle.close()
const readJson = async (path) => JSON.parse(await fs.readFile(path, 'utf8'))
const readFile = async (path) => await fs.readFile(path, 'utf8')
const writeJson = async (path, data) => await fs.writeFile(path, JSON.stringify(data, null, 0), { encoding: 'utf8', flag: 'w' })

const removeEnd = (data, pattern) => data.endsWith(pattern) ? data.slice(0, -pattern.length) : data
const ensureKey = (obj, key, defaultValue) => {
    if (obj[key] === undefined) {
        obj[key] = defaultValue
    }
    return obj[key]
}
const mergeProps = (props) => props.reduce((acc, prop) => ({ ...acc, ...prop }), {})

const parseScriptContent = (content) => {
    let isHeader = false
    const localProps = {}
    let bodyLines = []
    const imports = []
    for (let line of content.split('\n')) {
        line = line.replace('\r', '')
        if (line.startsWith('// ==UserScript==')) {
            isHeader = true
        } else if (line.startsWith('// ==/UserScript==')) {
            isHeader = false
        } else {
            if (isHeader) {
                const match = line.match(/^\/\/\s*@(\w+)\s+(.*)\s*$/)
                if (match !== null) {
                    const [, key, value] = match
                    if (propsTable.includes(key)) {
                        if (localProps[key] === undefined) {
                            localProps[key] = []
                        }
                        localProps[key].push(value)
                    } else {
                        localProps[key] = value
                    }
                }
            } else {
                const match = line.match(/^\s*\/\/\s*@import\{(.*)\}\s*$/)
                if (match !== null) {
                    const [, value] = match
                    imports.push(value)
                } else {
                    bodyLines.push(line)
                }
            }
        }
    }
    const { begin, end } = bodyLines.reduce((acc, line, index) => (line === '' ? acc : { begin: acc.begin == undefined ? index : acc.begin, end: index }), { begin: undefined, end: 0 })
    bodyLines = bodyLines.slice(begin, end + 1)

    return { imports, bodyLines, localProps }
}

const parseStyleContent = (content) => {
    let isHeader = false
    const localProps = {}
    let bodyLines = []
    for (let line of content.split('\n')) {
        line = line.replace('\r', '')
        if (line.startsWith('/* ==UserStyle==')) {
            isHeader = true
        } else if (line.startsWith('==/UserStyle== */')) {
            isHeader = false
        } else {
            if (isHeader) {
                const match = line.match(/^\s*@(\w+)\s+(.*)\s*$/)
                if (match !== null) {
                    const [, key, value] = match
                    if (propsTable.includes(key)) {
                        if (localProps[key] === undefined) {
                            localProps[key] = []
                        }
                        localProps[key].push(value)
                    } else {
                        localProps[key] = value
                    }
                }
            } else {
                bodyLines.push(line)
            }

        }
    }
    const { begin, end } = bodyLines.reduce((acc, line, index) => (line === '' ? acc : { begin: acc.begin == undefined ? index : acc.begin, end: index }), { begin: undefined, end: 0 })
    bodyLines = bodyLines.slice(begin, end + 1)

    return { bodyLines, localProps }
}

const resolveImports = async (imports, importFolder, importContent, parsed) => {
    if (importContent === undefined) {
        importContent = {}
    }
    if (parsed === undefined) {
        parsed = {}
    }
    for (const importName of imports) {
        const content = await readFile(`${importFolder}/${importName}.js`)
        if (parsed[importName] === undefined) {
            const { imports: subImports, bodyLines } = parseScriptContent(content)
            parsed[importName] = true
            await resolveImports(subImports, importFolder, importContent, parsed)
            importContent[importName] = bodyLines
        }
    }
    return importContent
}

const writeScriptHeaderKey = async (handle, key, value, keyLength) => {
    if (Array.isArray(value)) {
        for (const valueItem of value) {
            await writeScriptHeaderKey(handle, key, valueItem, keyLength)
        }
        return
    } else {
        await writeLine(handle, `// @${key}${' '.repeat(keyLength - key.length)} ${value}`)
    }
}

const writeScriptHeader = async (handle, props) => {
    const keyLength = Object.keys(props).reduce((acc, key) => Math.max(acc, key.length), 0)
    await writeLine(handle, '// ==UserScript==')
    for (const keyOrder of keyOrders) {
        if (props[keyOrder] !== undefined) {
            await writeScriptHeaderKey(handle, keyOrder, props[keyOrder], keyLength)
        }
    }
    for (const [key, value] of Object.entries(props)) {
        if (!keyOrders.includes(key)) {
            await writeScriptHeaderKey(handle, key, value, keyLength)
        }
    }
    await writeLine(handle, '// ==/UserScript==')
}

const writeStyleHeaderKey = async (handle, key, value, keyLength) => {
    if (Array.isArray(value)) {
        for (const valueItem of value) {
            await writeStyleHeaderKey(handle, key, valueItem, keyLength)
        }
        return
    } else {
        await writeLine(handle, `@${key}${' '.repeat(keyLength - key.length)} ${value}`)
    }
}

const writeStyleHeader = async (handle, props) => {
    const keyLength = Object.keys(props).reduce((acc, key) => Math.max(acc, key.length), 0)
    await writeLine(handle, '/* ==UserStyle==')
    for (const keyOrder of keyOrders) {
        if (props[keyOrder] !== undefined) {
            await writeStyleHeaderKey(handle, keyOrder, props[keyOrder], keyLength)
        }
    }
    for (const [key, value] of Object.entries(props)) {
        if (!keyOrders.includes(key)) {
            await writeStyleHeaderKey(handle, key, value, keyLength)
        }
    }
    await writeLine(handle, '==/UserStyle== */')
}

const populateUserscripts = (userscripts, path, props) => {
    userscripts[path] = []
    for (const prop in props) {
        if (Array.isArray(props[prop])) {
            for (const value of props[prop]) {
                userscripts[path].push([prop, value])
            }
        } else {
            userscripts[path].push([prop, props[prop]])
        }
    }
}

const compileScript = async (basename, content, props, userscripts, outFolder, importFolder, subPath) => {
    const { imports, bodyLines, localProps } = parseScriptContent(content)
    props = { ...props, ...localProps, name: basename }
    if (props['@import'] !== undefined) {
        props['@import'].forEach((importName) => imports.push(importName))
        delete props['@import']
    }

    const importContent = await resolveImports(imports, importFolder)

    populateUserscripts(userscripts, `${subPath}${basename}.user.js`, { ...props, type: 'script' })

    const outDir = `${outFolder}/${subPath}`
    const isDirectory = await isDir(outDir)
    if (!isDirectory) {
        await makedirs(outDir)
    }
    const outFile = `${outDir}/${basename}.user.js`
    const handle = await open(outFile, 'w')

    await writeScriptHeader(handle, props)

    await writeLine(handle, '')

    await writeLine(handle, `const script_name = GM_info?.script?.name || 'no-name'`)
    await writeLine(handle, `const script_version = GM_info?.script?.version || 'no-version'`)
    await writeLine(handle, "const script_id = `${script_name} ${script_version}`")
    await writeLine(handle, "console.log(`Begin - ${script_id}`)")

    await writeLine(handle, '')

    for (const [importName, importLines] of Object.entries(importContent)) {
        await writeLine(handle, '')
        await writeLine(handle, `// @imported_begin{${importName}}`)
        for (const line of importLines) {
            await writeLine(handle, line)
        }
        await writeLine(handle, `// @imported_end{${importName}}`)
    }

    await writeLine(handle, '')

    await writeLine(handle, `// @main_begin{${basename}}`)
    for (const line of bodyLines) {
        await writeLine(handle, line)
    }
    await writeLine(handle, `// @main_end{${basename}}`)

    await writeLine(handle, '')

    await writeLine(handle, "console.log(`End - ${script_id}`)")

    await close(handle)
}

const compileStyle = async (basename, content, props, userscripts, outFolder, subPath) => {
    const { bodyLines, localProps } = parseStyleContent(content)
    props = { ...props, ...localProps, name: basename }

    populateUserscripts(userscripts, `${subPath}${basename}.user.css`, { ...props, type: 'style' })

    const outDir = `${outFolder}/${subPath}`
    const isDirectory = await isDir(outDir)
    if (!isDirectory) {
        await makedirs(outDir)
    }
    const outFile = `${outDir}/${basename}.user.css`
    const handle = await open(outFile, 'w')

    await writeStyleHeader(handle, props)

    await writeLine(handle, '')

    for (const line of bodyLines) {
        await writeLine(handle, line)
    }

    await close(handle)
}

const compile = async (inFolder, outFolder, importFolder, pathName, commonProps, userscripts) => {
    const directories = []
    const scripts = {}
    const styles = {}

    let subPath = ''
    if (commonProps === undefined) {
        commonProps = []
    } else {
        commonProps = [...commonProps]
    }
    if (pathName === undefined || pathName === '') {
        subPath = ''
        pathName = ''
    } else {
        pathName = removeEnd(pathName, '/')
        subPath = pathName + '/'
    }
    if (userscripts === undefined) {
        userscripts = {}
    }
    const files = await fs.readdir(`${inFolder}/${pathName}`)

    for (const file of files) {
        const inFile = `${inFolder}/${subPath}${file}`
        const isDirectory = await isDir(inFile)
        if (isDirectory) {
            directories.push(file)
        } else if (file === 'common.props.json') {
            commonProps.push(await readJson(inFile))
        } else if (file.endsWith('.user.js')) {
            const basename = removeEnd(file, '.user.js')
            ensureKey(scripts, basename, {}).content = await readFile(inFile)
        } else if (file.endsWith('.props.json')) {
            const basename = removeEnd(file, '.props.json')
            ensureKey(scripts, basename, {}).props = await readJson(inFile)
        } else if (file.endsWith('.user.css')) {
            const basename = removeEnd(file, '.user.css')
            ensureKey(styles, basename, {}).content = await readFile(inFile)
        } else if (file.endsWith('.props.json')) {
            const basename = removeEnd(file, '.props.json')
            ensureKey(styles, basename, {}).props = await readJson(inFile)
        }

    }
    for (const directory of directories) {
        await compile(inFolder, outFolder, importFolder, `${subPath}${directory}`, commonProps, userscripts)
    }
    for (const [basename, { content, props }] of Object.entries(scripts)) {
        if (content !== undefined) {
            await compileScript(basename, content, mergeProps([...commonProps, props]), userscripts, outFolder, importFolder, subPath)
        }
    }
    for (const [basename, { content, props }] of Object.entries(styles)) {
        if (content !== undefined) {
            await compileStyle(basename, content, mergeProps([...commonProps, props]), userscripts, outFolder, subPath)
        }
    }
    if (subPath === '') {
        await writeJson(`${outFolder}/userscripts.json`, userscripts)
    }
}

compile('src', 'dist', 'snippet')

const fs = require('fs/promises')

const propsTable = ['grant', 'antifeature', 'require', 'resource', 'include', 'match', 'connect']
keyOrders = ['name', 'namespace', 'version', 'description', 'author', 'homepage', 'supportURL', 'match', 'icon', 'grant']

const shell = async (command) => {
    const { exec } = require('child_process')
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve({ stdout, stderr })
            }
        })
    })
}

const getGitVersion = async (files) => {
    const command = `git log -1 --date='format-local:%Y%m%dT-%H%M%S' --format="%cd-%h" -- ${files.map(f => `"${f}"`).join(' ')}`
    console.log(`Executing: ${command}`)
    const { stdout, stderr } = await shell(command)
    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
    console.log('-------------------')
    const command2 = `git log --date='format-local:%Y%m%dT-%H%M%S' --format="%cd-%h %B" ${files.map(f => `"${f}"`).join(' ')}`
    console.log(`Executing: ${command2}`)
    const { stdout: stdout2, stderr: stderr2 } = await shell(command2)
    console.log(`stdout: ${stdout2}`)
    console.log(`stderr: ${stderr2}`)
    console.log('===================')
    return stdout.trim()
}

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

const parseAtLine = (line, imports, grants, requires) => {
    const match = line.match(/^\s*\/\/\s*@(\w+)\{(.*)\}\s*$/)
    if (match !== null) {
        const [, keyword, value] = match
        switch (keyword) {
            case 'import':
                imports.push(value)
                return true
            case 'grant':
                grants.push(value)
                return true
            case 'require':
                requires.push(value)
                return true
        }
    }
    return false
}

const updateProps = (props, key, value) => {
    if (propsTable.includes(key)) {
        if (props[key] === undefined) {
            props[key] = []
        }
        if (!props[key].includes(value)) {
            props[key] = [...props[key], value]
        }
    } else {
        props[key] = value
    }
}

const parseScriptContent = (content) => {
    let isHeader = false
    const localProps = {}
    let bodyLines = []
    const imports = []
    const grants = []
    const requires = []
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
                    updateProps(localProps, key, value)
                }
            } else {
                if (!parseAtLine(line, imports, grants, requires)) {
                    bodyLines.push(line)
                }
            }
        }
    }
    const { begin, end } = bodyLines.reduce((acc, line, index) => (line === '' ? acc : { begin: acc.begin == undefined ? index : acc.begin, end: index }), { begin: undefined, end: 0 })
    bodyLines = bodyLines.slice(begin, end + 1)

    return { imports, grants, requires, bodyLines, localProps }
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
                    updateProps(localProps, key, value)
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

const resolveImports = async (imports, props, importFolder, importContent, parsed) => {
    if (importContent === undefined) {
        importContent = {
            filenames: new Set(),
            files: {}
        }
    }
    if (parsed === undefined) {
        parsed = {}
    }
    for (const importName of imports) {
        const filename = `${importFolder}/${importName}.js`
        const content = await readFile(filename)
        if (parsed[importName] === undefined) {
            const { imports: subImports, grants: subGrants, requires: subRequires, bodyLines } = parseScriptContent(content)
            parsed[importName] = true
            await resolveImports(subImports, props, importFolder, importContent, parsed)
            subGrants.forEach((grant) => updateProps(props, 'grant', grant))
            subRequires.forEach((require) => updateProps(props, 'require', require))
            importContent.files[importName] = bodyLines
            importContent.filenames.add(filename)
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

const compileScript = async (basename, content, filenames, globalProps, userscripts, outFolder, importFolder, subPath) => {
    const { imports, grants, requires, bodyLines, localProps } = parseScriptContent(content)
    props = { ...globalProps, ...localProps, name: basename }
    grants.forEach((grant) => updateProps(props, 'grant', grant))
    requires.forEach((require) => updateProps(props, 'require', require))

    if (props['@import'] !== undefined) {
        props['@import'].forEach((importName) => imports.push(importName))
        delete props['@import']
    }

    const importContent = await resolveImports(imports, props, importFolder)

    if (props['grant'] !== undefined && props['grant'].includes('none') && props['grant'].length > 1) {
        props['grant'].splice(props['grant'].indexOf('none'), 1)
    }

    if (props['version'] === undefined) {
        props['version'] = await getGitVersion([...filenames, ...Array.from(importContent.filenames)])
    }

    if (props['description'] === undefined) {
        props['description'] = props['name']
    }

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

    for (const [importName, importLines] of Object.entries(importContent.files)) {
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

const compileStyle = async (basename, content, filenames, props, userscripts, outFolder, subPath) => {
    const { bodyLines, localProps } = parseStyleContent(content)
    props = { ...props, ...localProps, name: basename }

    if (props['version'] === undefined) {
        props['version'] = await getGitVersion([...filenames])
    }

    if (props['description'] === undefined) {
        props['description'] = props['name']
    }

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
            ensureKey(scripts, basename, {filenames: new Set()}).content = await readFile(inFile)
            scripts[basename].filenames.add(inFile)
        } else if (file.endsWith('.props.json')) {
            const basename = removeEnd(file, '.props.json')
            ensureKey(scripts, basename, {filenames: new Set()}).props = await readJson(inFile)
            scripts[basename].filenames.add(inFile)
        } else if (file.endsWith('.user.css')) {
            const basename = removeEnd(file, '.user.css')
            ensureKey(styles, basename, {filenames: new Set()}).content = await readFile(inFile)
            styles[basename].filenames.add(inFile)
        } else if (file.endsWith('.props.json')) {
            const basename = removeEnd(file, '.props.json')
            ensureKey(styles, basename, {filenames: new Set()}).props = await readJson(inFile)
            styles[basename].filenames.add(inFile)
        }

    }
    for (const directory of directories) {
        await compile(inFolder, outFolder, importFolder, `${subPath}${directory}`, commonProps, userscripts)
    }
    for (const [basename, { content, props, filenames }] of Object.entries(scripts)) {
        if (content !== undefined) {
            await compileScript(basename, content, filenames, mergeProps([...commonProps, props]), userscripts, outFolder, importFolder, subPath)
        }
    }
    for (const [basename, { content, props, filenames }] of Object.entries(styles)) {
        if (content !== undefined) {
            await compileStyle(basename, content, filenames, mergeProps([...commonProps, props]), userscripts, outFolder, subPath)
        }
    }
    if (subPath === '') {
        await writeJson(`${outFolder}/userscripts.json`, userscripts)
    }
}

compile('src', 'dist', 'snippet')

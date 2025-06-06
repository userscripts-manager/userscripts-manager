#!/usr/bin/env bash

this_script="${0}"
this_dir=$(readlink -f $(dirname "${this_script}"))
script_name=$(basename "${this_script}")
this_script_fullname="$(readlink -f "${this_script}")"
this_script_basedir="$(dirname "${this_script_fullname}")"

version="dev"

author_explicit="0"
homepage_explicit="0"
support_explicit="0"

force="0"

src_dir="${this_dir}/src"
common_file="${src_dir}/common.props.json"

read_common_file() {
    propname="${1}"
    [ -f "${common_file}" ] && {
        cat "${common_file}" | jq -r ".${propname}"
    } || echo ""
}

author=$(read_common_file "author")
homepage=$(read_common_file "homepage")
support=$(read_common_file "supportURL")

get_author() {
    [ -n "${author}" ] && echo -n "${author}" || echo -n "me"
}
get_homepage() {
    [ -n "${homepage}" ] && echo -n "${homepage}" || echo -n "https://github.com/$(get_author)/userscripts"
}
get_support() {
    [ -n "${support}" ] && echo -n "${support}" || echo -n "$(get_homepage)/issues"
}

ensure_common() {
    [ -f "${common_file}" ] || {
        mkdir -p "${src_dir}"
        echo '{' > "${common_file}"
        echo '    "namespace": "'"${homepage}"'",' >> "${common_file}"
        echo '    "author": "'"${author}"'",' >> "${common_file}"
        echo '    "homepage": "'"${homepage}"'",' >> "${common_file}"
        echo '    "supportURL": "'"${support}"'",' >> "${common_file}"
        echo '    "grant": [' >> "${common_file}"
        echo '        "none"' >> "${common_file}"
        echo '    ]' >> "${common_file}"
        echo '}' >> "${common_file}"
    }
    [ -f "${src_dir}/website.css" ] || echo "/* Put here the custom css content you want for your generated user scripts/style website */" > "${src_dir}/website.css"
}

help() {
    echo "${script_name} ACTION [OPTIONS]"
    echo ""
    echo "  ACTIONS:"
    echo ""
    echo "    createjs DIRNAME SCRIPTNAME      create a new userscript name SCRIPTNAME in DIRNAME"
    echo "    createcss DIRNAME SCRIPTNAME     create a new userstyle name SCRIPTNAME in DIRNAME"
    echo "    publish                          create a distribution dir"
    echo "    clean                            clean distribution dir"
    echo "    install DIRNAME                  install the tool in DIRNAME linking to instance of the tool"
    echo "    config                           configure the tool"
    echo "    update                           update the tool to the latest version"
    echo ""
    echo "  OPTIONS"
    echo "    -a, --author AUTHOR              use AUTHOR for author name"
    echo "    -h, --homepage HOMEPAGE          use HOMEPAGE for homepage url"
    echo "    -s, --support SUPPORT            use SUPPORT for support url (issues)"
    echo "    -f, --force                      force to create scripts/styles even if they exist"
    echo "    -v, --set-version VERSION        provide version VERSION (for dist)"
    echo ""
}

message() {
    echo "${@}"
}

error() {
    echo "ERROR: ${@}" >&2
}

fail () {
    error "${@}"
    echo ""
    help
    exit 1
}

action=""
dirname=""
scriptname=""
error=""

create_script() {
    ensure_common
    scriptfilename="${src_dir}/${dirname}/${scriptname}.user.js"
    [ -f "${scriptfilename}" ] && [ "${force}" == "0" ] && fail "Script ${scriptfilename} already exists"
    mkdir -p "$(dirname "${scriptfilename}")"
    echo "// ==UserScript==" > "${scriptfilename}"
    echo "// @version      0.0.0" >> "${scriptfilename}"
    echo "// @description  ${scriptname}" >> "${scriptfilename}"
    echo "// @match        https://example.com/*" >> "${scriptfilename}"
    echo "// @match        https://www.example.com/*" >> "${scriptfilename}"
    echo "// ==/UserScript==" >> "${scriptfilename}"
    echo "" >> "${scriptfilename}"
}

create_style() {
    ensure_common
    stylefilename="${src_dir}/${dirname}/${scriptname}.user.css"
    [ -f "${stylefilename}" ] && [ "${force}" == "0" ] && fail "Style ${stylefilename} already exists"
    mkdir -p "$(dirname "${stylefilename}")"
    echo "/* ==UserStyle==" > "${stylefilename}"
    echo "@version        0.0.0" >> "${stylefilename}"
    echo "@description    ${scriptname}" >> "${stylefilename}"
    echo "==/UserStyle== */" >> "${stylefilename}"
    echo "" >> "${stylefilename}"
    echo "@-moz-document domain("example.com") {" >> "${stylefilename}"
    echo "" >> "${stylefilename}"
    echo "}" >> "${stylefilename}"
}

publish() {
    ensure_common
    dist_dir="${this_dir}/dist"
    tmp_dir="${this_dir}/tmp"
    rm -rf "${dist_dir}" "${tmp_dir}"

    node --version > /dev/null 2>&1 || fail "node is not installed"
    node "${this_script_basedir}/compile-userscripts.js"

    echo "{\"version\":\"${version}\"}" > "${dist_dir}/version.json"
    cp -f "${this_script_basedir}/website/index.html" "${this_script_basedir}/website/userscripts.js" "${dist_dir}/"
    [ -f "${src_dir}/website.css" ] && cp -f "${src_dir}/website.css" "${dist_dir}/"
    touch "${dist_dir}/.nojekyll"
}

clean() {
    dist_dir="${this_dir}/dist"
    tmp_dir="${this_dir}/tmp"
    rm -rf "${dist_dir}" "${tmp_dir}"
}

config() {
     if [ "${author_explicit}" == "0" ]
    then
        author=$(get_author)
        read -p "Author ? [${author}] > " new_author
        [ -n "${new_author}" ] && author="${new_author}"
        author_explicit="1"
    fi
    if [ "${homepage_explicit}" == "0" ]
    then
        homepage=$(get_homepage)
        read -p "Homepage ? [${homepage}] > " new_homepage
        [ -n "${new_homepage}" ] && homepage="${new_homepage}"
        homepage_explicit="1"
    fi
    if [ "${support_explicit}" == "0" ]
    then
        support=$(get_support)
        read -p "Support page ? [${support}] > " new_support
        [ -n "${new_support}" ] && support="${new_support}"
        support_explicit="1"
    fi
    rm -f "${common_file}"
    ensure_common
}

install() {
    dirname="$(readlink -f "${dirname}")"

    relative_path=$(realpath -m --relative-to "${dirname}" "${this_script_fullname}")

    relative_dirname=$(dirname "${relative_path}")

    ln -f -s "${relative_path}" "${dirname}/"
    mkdir -p "${dirname}/.github/workflows"
    cp -f "${this_script_basedir}/github-workflow/"*.yml "${dirname}/.github/workflows/"
    cp -f "${this_script_basedir}/gitlab-workflow/"gitlab-ci.yml "${dirname}/.gitlab-ci.yml"
}

update() {
    dirname="${this_dir}"
    relative_path=$(realpath -m --relative-to "${dirname}" "${this_script_fullname}")
    relative_dirname=$(dirname "${relative_path}")
    git pull --rebase --recurse-submodules
    cd "${relative_dirname}"
    git checkout -B master origin/master
    cd "${this_dir}"

    ln -f -s "${relative_path}" "${dirname}/"
    ln -f -s "${relative_dirname}/justfile" "${dirname}"
    mkdir -p "${dirname}/.github/workflows"
    cp -f "${this_script_basedir}/github-workflow/"*.yml "${dirname}/.github/workflows/"
    cp -f "${this_script_basedir}/gitlab-workflow/"gitlab-ci.yml "${dirname}/.gitlab-ci.yml"
}

while [ "${#}" -gt "0" ]
do
    param="${1}"
    shift

    case "${param}" in
        createjs)
            [ -n "${1}" ] && [ -n "${2}" ] && {
                action="create_script"
                dirname="${1}"
                scriptname="${2}"
                shift
                shift
            } || {
                error="Should provide DIRNAME and SCRIPTNAME for [${param}]"
            }
            ;;

        createcss)
            [ -n "${1}" ] && [ -n "${2}" ] && {
                action="create_style"
                dirname="${1}"
                scriptname="${2}"
                shift
                shift
            } || {
                error="Should provide DIRNAME and SCRIPTNAME for [${param}]"
            }
            ;;

        publish)
            action="publish"
            ;;
            
        clean)
            action="clean"
            ;;
            
        config)
            action="config"
            ;;

        install)
            [ -n "${1}" ] && {
                action="install"
                dirname="${1}"
                shift
            } || {
                error="Should provide DIRNAME for [${param}]"
            }
            ;;

        update)
            action="update"
            ;;

        -a|--author)
            author="${1}"
            author_explicit="1"
            shift
            ;;

        -h|--homepage)
            homepage="${1}"
            homepage_explicit="1"
            shift
            ;;

        -s|--support)
            support="${1}"
            support_explicit="1"
            shift
            ;;

        -f|--force)
            force="1"
            ;;

        -v|--set-version)
            version="${1}"
            shift
            ;;

        *)
            error="Don't understand [${param}]"
            ;;

    esac
done

[ -n "${error}" ] && fail "${error}"
[ -z "${action}" ] && fail "Don't know what to do"

"${action}"

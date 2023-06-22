**userscripts-manager** is project that aims to help create a repository to host userscripts (and userstyles).

The goal is to provide everything related to creating a website from a repository, using github action (when hosted on github, but some other hosting facilties may be added in the future), creating new script (or new style) from scrtach, handling versionning, etc.

Note: The tool is right now in alpha stage. While there are some use cases that works, it's not fully operational.

# Create a new userscript repository by cloning

Note: This way of creating a repository isn't working yet as the repository to clone doesn't exists yet.

* Clone the repository https://github.com/userscripts-manager/userscripts ( !Warning! : The repository doesn't exists yet )
* [Configure your repository](#configure-your-newly-created-userscript-repository) (see the dedicated section)
    * While your repository is not fully configured, actions may fail, it's not a problem as long as it doesn't fail anymore when the repository is fully configured

# Create a new userscript repository from scratch

This part suppose your are using a unix compatible environnement, like linux, macos X, or WSL under windows (or even termux under android if you are skilled and patient)

* Create a repository from scratch
* Clone it and go the directory
    * `git clone https://github.com/<yourname>/userscripts`
    * `cd userscripts`
* Add `usercripts-manager` as a git submodule
    * `git submodule add https://github.com/userscripts-manager/userscripts-manager`
* Install *usercripts-manager* inside your repository
    * `./userscripts-manager/manage.sh install .`
* Commit the result to your repository
    * `git add .`
    * `git commit -m "Initialising a userscripts repository using userscripts-manager"`
    * `git push`
* [Configure your repository](#configure-your-newly-created-userscript-repository) (see the dedicated section)
    * While your repository is not fully configured, actions may fail, it's not a problem as long as it doesn't fail anymore when the repository is fully configured

# Configure your newly created userscript repository

## github

* In your *github profile*, go to "*Settings*" -> "*Developer settings*" -> "*Personal access tockens*" -> "*Tokens (classic)*"
    * In the dropdown "*Generate a new token*" choose "*Generate a new token (classic)*"
    * After identification, enter the name of the new token "PAT for userscripts-manager update"
    * Select an appropriate Expiration date (be carrefull, after expiration you'll need to regenerate the token, choose wisely)
    * Select workflow in the "scopes"
    * Click on the green button at the bottom "*Generate token*"
    * Copy the generated token
    * In your newly created repository, go to "*Settings*" -> "*Security*" -> "*Secrets and variables*" -> "*Actions*"
        * Click on "*New repository secret*"
        * Paste the token in the *secret* filed
        * Name you new secret *PAT_WORKFLOW*
* In your newly created repository, go to "*Settings*" -> "*Code and automation*" -> "*Actions*" -> "*General*"
    * In "*Worflow permissions*" section, select "*Read and write persmissions*" and "*Save*"
        * Note that if that if the choice is disabled, it's most probably because the repository is associated with an organisation. You'll have to configure first the organisation with the exact same parameter inside the oraganisation, and then you'll be able to configure it inside the repository.
* In your newly created repository, go to the tab "*Actions*"
    * On the left side select the workflow *Publish user scripts and styles to GitHub Pages*
        * There is blue banner with a button/dropdown named "**Run workflow**". Click on it, and then click the green button "**Run workflow**".
* In your newly created repository, go to "*Settings*" -> "*Code and automation*" -> "*Pages*"
    * Under **Source**, verify that the choice is "**Deploy from a branch**"
    * Under **Branch**, set **gh-pages** and then Save.

* Your newly created website is now accessible under the url `https://<yourname>.github.io/userscripts`
    * **Note**: you'll probably see a white page as you haven't yet created some scripts.

## Other sites

Other git hosting repositories are not yet supported. You can host your repo on those sites, but no CI will work, and no web site will be automaticlly generated yet.

# Create a new script

## Using github actions

* Go to github actions (tab "*Actions*" in your repository)
* Select the workflow "*Create an new user script (js)*"
* Select "*Run workflow*"
* Enter the folder name and script name as requested
* Click on the green button "*Run workflow*"
* A new script will be added to the repository using a default template for your repository

To edit you script from within the browser, you can just:

* Go to the main page of your repository
* Press the "." key
* You'll then have a VS code editor you can use to edit your repository, and commit the changes
* Once commited, the changes will automatically start a workflow to generate a new version of the website associated to your repository, and that's all.

Remember to change the version of your script each time you change a script or else extensions won't update your script.

## Using command line and local IDE

* Clone your repo with submodules (if not already the case) and go to the repo folder
    * `git clone --recurse-submodules <your repo url>`
    * `cd <your repo name>` (most probably `cd userscripts`)
* Create a new script
    * `./manage.sh createjs "<folder name>" "<script name>"`
* Edit the script with your prefered ide, which name is `src/<folder name>/<script name>`
* Commit the changes and push it to github
* Once commited, the changes will automatically start a workflow to generate a new version of the website associated to your repository, and that's all.

Remember to change the version of your script each time you change a script or else extensions won't update your script.

# Extensions to run userscripts and userstyles

There are several extensions to run userscripts and userstyles

## Recommanded extension to run userscripts

* **Violentmonkey**
    * **Website** : https://violentmonkey.github.io/ 
    * **github** : https://github.com/violentmonkey/violentmonkey

## Recommanded extension to run userstyles

* **Stylus**
    * **Website** : https://add0n.com/stylus.html
    * **github** : https://github.com/openstyles/stylus

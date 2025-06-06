**userscripts-manager** is project that aims to help create a repository to host userscripts (and userstyles).

The goal is to provide everything related to creating a website from a repository, using github action (when hosted on github, but some other hosting facilties may be added in the future), creating new script (or new style) from scrtach, handling versionning, etc.

Sources:
* https://github.com/userscripts-manager/userscripts-manager
* https://gitlab.com/userscripts-manager/userscripts-manager

Template repositories to clone:
* https://github.com/userscripts-manager/userscripts
* https://gitlab.com/userscripts-manager/userscripts

# Create a new userscript repository by cloning
 
* Clone the repository https://github.com/userscripts-manager/userscripts on github or https://gitlab.com/userscripts-manager/userscripts on gitlab 
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
    * If the *Actions* tab says the actions are disabled, enable them but clicking on the green button "**I understand my workflows, go ahead and enable them**".
    * On the left side select the workflow *Publish user scripts and styles to GitHub Pages*
        * There is blue banner with a button/dropdown named "**Run workflow**". Click on it, and then click the green button "**Run workflow**".
    * Wait for the job to end
* In your newly created repository, go to "*Settings*" -> "*Code and automation*" -> "*Pages*"
    * Under **Source**, verify that the choice is "**Deploy from a branch**"
    * Under **Branch**, set **gh-pages** and then Save.
* On the main page of the repository, locate the "**About**" section on the right of the screen and click on the gear icon
    * In the "*Edit repository details*" window, locate the checkbox "*Use your github pages website*" and click the link
    * Click on the green button "**Save changes**"
    * You web site is now accessible from the "**About**" section.

* Your newly created website is now accessible under the url `https://<yourname>.github.io/userscripts`
    * **Note**: you'll probably see a white page as you haven't yet created some scripts.
    * You can now create new scripts and styles

## gitlab

* By default, gitlab doesn't need any configuration to run the actions.
* By default, gitlab doesn't need any configuration to publish pages.
* By default, all your pages will be private, so you need to change the visibility of your pages if you want them to be public (if not, your userscripts will only be visible by people who have access to your repo, which is ideal for a private userscript repo).
    * Go to your repository
    * Click on the "*Settings*" tab
    * Click on "*General*" in the left menu
    * Scroll down to the "*Visibility, project features, permissions*" section
    * In the "*Pages*" section, select "*Everyone*" or "*Only project members*" depending on your needs
    * Click on the button "*Save changes*"

## Other sites

Other git hosting repositories are not yet supported. You can host your repo on those sites, but no CI will work, and no web site will be automaticlly generated yet, but you can still write CI/CD yourself to do so.

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

## Using gitlab actions

Not available yet.

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

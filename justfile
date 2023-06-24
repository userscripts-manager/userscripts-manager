alias js := createjs
alias css := createcss

createjs FOLDER NAME:
    bash ./manage.sh createjs {{FOLDER}} {{NAME}}

createcss FOLDER NAME:
    bash ./manage.sh createcss {{FOLDER}} {{NAME}}

update:
    bash ./manage.sh update

publish:
    bash ./manage.sh publish

clean:
    bash ./manage.sh clean

config:
    bash ./manage.sh config

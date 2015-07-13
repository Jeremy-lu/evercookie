## Evercookie

##### related sources
* [evercookie](https://github.com/samyk/evercookie)
* [node-evercookie](https://github.com/truongsinh/node-evercookie)


#### Simulate test
> don't forget to clear you browser cookie and history

##### normal
start app
    sudo PORT=80 node app.js
set hosts
    127.0.0.1 www.evercookie.com
then, visit http://www.evercookie.com to check.

##### inside iframe
start app
    sudo PORT=80 node app.js
set hosts
    127.0.0.1 www.evercookie.com(/public/iframe/index.html will use this domain)
    127.0.0.1 www.mypage.com
then, visit http://www.mypage.com/iframe/index.html to check.
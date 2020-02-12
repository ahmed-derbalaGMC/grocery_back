
[logo]: https://www.google.com/url?sa=i&url=https%3A%2F%2Fmedium.com%2Fgomycode&psig=AOvVaw2jcUZcSotBVC179-4h7z0T&ust=1581603621570000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCICb0uKazOcCFQAAAAAdAAAAABAD 
# ***Grocery***
## IMPORTANT NOTES :
`YOU NEED TO RELOAD THIS PAGE EVERY TIME YOU NEED IT BECAUSE IT GETS UPDATED FREQUENTLY, CHECK IT BEFORE CONTACTING BACKEND DEVELOPER`  |
-|

`Most of the requests needs to include a valid token on the header`  |
-|

`You should connect to the socket ONLY After a succesfull login request (/user/login)`  |
-|

`You should connect to the socket like this: socket = io(server, { query: { token } });`|
-|

`most GET requests should be sent with page on the HEADER, you should expect pageCount on the response, if page==0 or no page sent, the response will contains maximum 1000 entries`  |
-|

`most GET (/all) requests support searching, you can add search attribute on the header`  |
-|

`you can always check logs via 192.168.100.101:3008, if nothing is shown try to reset logs via 192.168.100.101:3008/resetLogs `  |
-|

### http status codes
| STATUS | MESSAGE                                                                                                |
|--------|--------------------------------------------------------------------------------------------------------|
| `200`  | success                                                                                                |
| `201`  | success and new entry created                                                                          |
| `204`  | success but response is empty                                                                          |
| `209`  | not updated, may because of new values equal to old values                                                   |
| `210`  | params sent are not valid comparing to data saved in DB but the server handled it |
| `401`  | token errors (missing, invalid, expired ..) you should try relogin before contacting backend developer |
| `403`  | you dont have permission, check the role                                                               |
| `422`  | request params or body are malformed, reload this doc for any changes of attributes names              |
| `423`  | wrong password              |
| `424`  | entry duplication               |
| `461`  | a unique constraint error                                                                              |
| `522`  | database fail, you should contact backend developer                                                    |
| `523`  | operation error, redoing the action with different parameters may succeed (it may be temporary error)  |
| `524`  | operation error but it can be overrided, headers.force=true required to override |


## signin
``` POST
http://192.168.6.65:3001/user/signin
```
a user can login with his email
### body
```
{
  email: String,
  password: String
}
```
### Response
```
{
    user object or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## signup
``` POST
http://192.168.6.65:3001/user/signup
```
a user can register with his email and password
### body
```
{
  email: String,
  password: String
}
```
### Response
```
{
    user object or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## add
``` POST
http://192.168.6.65:3001/product/add
```
create new product
### body
```
{
  name: String,
  quantity: Number
}
```
### Response
```
{
    product object or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## sort products
``` GET
http://192.168.6.65:3001/product/sort/?name=xxx&quantity=xxx
```
sorting products by name or quantity
### Response
```
{
    user object or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## list all products
``` GET
http://192.168.6.65:3001/product/all
```
list all products 

### Response
```
{
    products object or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## destroy order
``` DELETE
http://192.168.6.65:3001/order/destroy/:id
```
delete an order from database
### Response
```
{
    message or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## user request his orders
``` GET
http://192.168.6.65:3001/order/mine
```
user request his orders
### Response
```
{
    objects or error
}
```
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


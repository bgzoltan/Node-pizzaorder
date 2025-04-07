# Node-pizzaorder

This application is a NodeJS-based server that provides services for a pizza ordering and delivery client-side application.

At 07.04.2025 provided services are the followings:

- /tokens -> users can login and logout (post or delete),
- /users -> create, read, update and delete users (post, get, put, delete),
- /pizzamenu -> read the current menu list stored in a json file (get),
- /shoppingcart -> add, update and delete pizza items to shopping cart (post, put, delete),
- /order -> order the contents of the shopping cart: check the ordered items, pay by approving the credit card, then send a message to the user and place the ordered items in the orders folder for later use.

Other important functions:

- automatic logout of the user after the token expires.

Integrations:

- Stripe to accept credit card payments
- Mailgun for e-mail messages sent to the user

Developer:

- Zoltan Bagdany, full-stack developer
- if you have any question, you can reach me here: bgzoltan@gmail.com

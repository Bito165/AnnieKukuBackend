const express = require('express');
const app = express();
const router = express.Router();
const sql = require('mysql');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const nodemailer = require('nodemailer');

const multer = require('multer');
const axios = require("axios");
const juice = require("juice");
const {htmlToText} = require("html-to-text");
const storage = multer.memoryStorage()
//define the type of upload multer would be doing and pass in its destination, in our case, its a single file with the name photo
const upload = multer({storage: storage});
let cards = [];

// const pool = sql.createPool({
//     connectionLimit: 1000000,
//     host: '127.0.0.1',
//     user: 'root',
//     password: '',
//     database: 'anniekuku',
//     multipleStatements: true
// });

const pool = sql.createPool({
    connectionLimit: 1000000,
    host: 'r6ze0q02l4me77k3.chr7pe7iynqr.eu-west-1.rds.amazonaws.com',
    port: '3306',
    user: 'cq7bslzg89bzf3rl',
    password: 'v1kjmgf770pbvt4s',
    database: 'wn9v9fnyzffqn302',
    multipleStatements: true
});


function sendNewsletter(customer_name, destination, cards){
    const templatePath = `views/giftcard-newsletter.html`;
    const templateVars = {
        customer_name,
        cards
    };
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = ejs.render(template, templateVars);
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);

    sendMail(text, templateVars, htmlWithStylesInlined, destination, 'Anniekuku Accessories Newsletter Subscription');
}

function sendGiftCards(customer_name, destination, cards){
    const templatePath = `views/giftcard-purchase.html`;
    const templateVars = {
        customer_name,
        cards
    };
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = ejs.render(template, templateVars);
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);
    sendMail(text, templateVars, htmlWithStylesInlined, destination, 'Anniekuku Accessories Gift Card');
}

function updateOrder(order){
    const templatePath = `views/index.html`;
    const templateVars = order;
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = ejs.render(template, templateVars);
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);

    sendMail(text, templateVars, htmlWithStylesInlined, order.customer_email, 'Your Order With Anniekuku Accessories');
}


function sendMail(text, templateVars, htmlWithStylesInlined, destination, subject){
    // Step 1
    let transporter = nodemailer.createTransport({
        host: 'mail.anniekuku.com',
        pool: true,
        port: 465,
        secure: true,
        auth: {
            user: 'sales@anniekuku.com',
            pass: 'Allforanniekuku007$'
        },
        tls:{
            rejectUnauthorized:false
        }
    });


    // Step 3
    let mailOptions = {
        from: 'sales@anniekuku.com', // TODO: email sender
        to: destination, // TODO: email receiver
        subject: subject,
        text: text,
        templateVars: templateVars,
        html: htmlWithStylesInlined // html body
    };

// Step 4
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            sendMail(text, templateVars, htmlWithStylesInlined)
        } else {
            return console.log('Email sent!!!');
        }
    })
}



pool.getConnection(function (err, connection) {
    if (err){


    }else{


    function generateNewsLetterGiftCard(body){
        let createddate = new Date();
        let code = `GFT-AK-${createddate.getTime()}`;
        const giftCardGen = "INSERT INTO giftcards (code, amount_left, number_of_times_used, createddate) values (?, ?, ?, ?)"
        connection.query(giftCardGen, [code, '10%', 0, createddate], (err, result) => {
            if(err){
                console.log({err})
            }else{
                cards = {gift_code: code, amount: '10%'}
                sendNewsletter(body.customer_name, body.customer_email, cards);
            }
        });
    }

    function createGiftCardEntry(element, j, req){
        let createddate = new Date();
        let code = '';
        code = createddate.getTime() + j;
        code = `GFT-AK-${code}`;
        const giftCardGen = "INSERT INTO giftcards (code, amount_left, number_of_times_used, createddate) values (?, ?, ?, ?)"
        connection.query(giftCardGen, [code, element.item_price, 0, createddate], (err, result) => {
            if(err){
                console.log({err})
            }else{
                cards.push({gift_code: code, amount: element.item_price});
                if(cards !== undefined && (cards.length === element.item_quantity)){
                    sendGiftCards(req.body.customer_name, req.body.customer_email, cards);
                    cards = [];
                }
            }
        });
    }

    /* GET api listing. */
    router.get('/', (req, res) => {
        //// console.log(res.send);
        const bito = {'api': 'izz working'};
        updateOrder({order_id: 123, createddate: '12/03/12'});
        res.send(bito);
    });

    router.get('/dashboard', (req, res) => {
        const query = "Select * from orders where status = 0; Select * from messages where subject = 1 and status = 0 ; Select * from products where item_quantity > 0; Select * from expensesources; Select * from revenuesources";
        connection.query(query, function (err, result) {
            if (err) {
                //// console.log(err);
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/revenue/history', (req, res) => {
        const query = "SELECT * from revenue; SELECT * from revenuesources";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });


    router.get('/messages/', (req, res) => {
        const query = "SELECT * from messages";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/expenses/history', (req, res) => {
        const query = "SELECT * from expenses;  SELECT * from expensesources";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })

    });

    router.get('/orders/history', (req, res) => {
        const query = "SELECT * from orders order by status asc";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/orders/details/:id', (req, res) => {
        const query = "SELECT * from orderdetails where order_id = ?";
        connection.query(query, [req.params.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/orders/search/:string', (req, res) => {
        const query = "SELECT * from orders WHERE order_id Like '%" + req.params.string + "%' OR client_name Like '%" + req.params.string + "%' ";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/products/search/:string', (req, res) => {
        const query = "SELECT * from products WHERE item_name Like '%" + req.params.string + "%' ";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/customers/search/:string', (req, res) => {
        const query = "SELECT * from customers WHERE customer_phone_number Like '%" + req.params.string + "%' OR customer_email Like '%" + req.params.string + "%' OR customer_name Like '%" + req.params.string + "%' ";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/search/:string', (req, res) => {
            const query = "SELECT * from products WHERE item_name Like ?; SELECT * from productcategories WHERE category_name Like ?;" ;
            connection.query(query, [`%${req.params.string}%`, `%${req.params.string}%`], (err, result) => {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);

                }
            })
        });

    router.get('/orders/customers/:id', (req, res) => {
        const query = "SELECT * from orderdetails where order_id = ?; SELECT * from orders where order_id = ?";
        connection.query(query, [req.params.id, req.params.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/profit-loss/history', (req, res) => {
        const query = "SELECT * from revenue; SELECT * from expenses";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/staff-list', (req, res) => {
        const query = "SELECT * from staff";
        connection.query(query, [req.body.source], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/maintenance', (req, res) => {
        const query = "SELECT * from users; SELECT * from productcategories; SELECT * from revenuesources; SELECT * from expensesources; SELECT * from carousel";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/customer-list', (req, res) => {
        const query = "SELECT * from customers";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/customer/order/history/:customer_name/:customer_email/:customer_phone_number', (req, res) => {
        const query = "SELECT * from orders where customer_name = ? and customer_email = ? and customer_phone_number = ?";
        connection.query(query, [req.params.customer_name, req.params.customer_email, req.params.customer_phone_number], function (err, result) {
            if (err) {
                res.send(err);
            } else {

                res.send(result);

            }
        })
    });

    router.get('/carousel', (req, res) => {
        const query = "SELECT * from carousel";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/discount/retrieve/:id', (req, res) => {
        const query = "SELECT * from giftcards where code = ?";
        connection.query(query, [req.params.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                if (result.length > 0) {
                    res.send(result);

                } else {
                    const message = {
                        'status': 0,
                        'message': 'Gift Card Not Found'
                    }
                    res.send(message);

                }
            }
        })
    })

    router.get('/public/merch/all', (req, res) => {
        const query = "SELECT * from products order by quantity_sold desc";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/business/merch/all', (req, res) => {
        const query = "SELECT * from products";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/business/merch/categories', (req, res) => {
        const query = "SELECT * from productcategories";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/business/staff/categories', (req, res) => {
        const query = "SELECT * from staffcategories";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    })

    router.get('/order/details/:id', (req, res) => {
        const query = "SELECT * from orderdetails where order_id = ?; SELECT * from orders where order_id = ?";
        connection.query(query, [req.params.id, req.params.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/home', (req, res) => {
        const query = "SELECT * from carousel; SELECT * from products order by quantity_sold desc LIMIT 6; SELECT * from products order by createddate desc LIMIT 6; SELECT * from products where old_price > item_price order by quantity_sold desc LIMIT 6"
        connection.query(query, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/shopnow', (req, res) => {
        const query = "SELECT * from products; SELECT * from productcategories;"
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/best-sellers', (req, res) => {
        const query = "SELECT * from products order by quantity_sold desc;"
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/product/:category/:id', (req, res) => {
        const query = "SELECT * from products where id = ?; SELECT * from products where item_category = ? order by quantity_sold desc LIMIT 6"
        connection.query(query, [req.params.id, req.params.category], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);

            }
        })
    });

    router.get('/product/:category', (req, res) => {
        const query = "SELECT * from products where item_category = ? order by quantity_sold"
        connection.query(query, [req.params.category], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                res.send(result);
            }
        })
    });

    router.get('/verify/transactions/:reference', (req, res) => {


            axios.get(`https://api.paystack.co/transaction/verify/${req.params.reference}`, {headers: {
                    'Content-Type':  'application/json',
                    'Authorization': 'Bearer sk_test_2d627c67d4b161d171cbbb8304cf86a45955a8d9'
                }})
                .then( (response) => {
                    res.send(response.data);
                }).catch( (err) => {
                    res.send(err.data);
                })

    })


//--POST APIS--//

    router.post('/login', (req, res) => {
        const query = "Select * from users where username = ?"
        connection.query(query, [req.body.username], function (err, result) {
            if (err) {
                //// console.log(err)
                res.send(err);
            } else {
                if (result.length === 0) {
                    const message = {
                        "message": "User not found"
                    }
                    res.send(message);

                } else {
                    if (req.body.password === result[0].password) {
                        const time = new Date();
                        const update = "UPDATE users set last_login = ? where username = '" + req.body.username + "' ";
                        connection.query(update, [time]);
                        const message = {
                            "message": "Success",
                            "data": result
                        }
                        res.send(message);
                    } else {
                        const message = {
                            "message": "Incorrect information supplied"
                        }
                        res.send(message);

                    }
                }
            }
        })

    });

    router.post('/expenses/new', (req, res) => {
        const createddate = new Date();
        const query = "INSERT INTO expenses (amount, source, description, week_day, month, year, createdby, createddate) values (?,?,?,?,?,?,?,?)";
        connection.query(query, [req.body.amount, req.body.source,  req.body.description,  req.body.week_day, req.body.month,req.body.year, req.body.createdby, createddate], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    });

    router.post('/revenue/new', (req, res) => {
        const createddate = new Date();
        const query = "INSERT INTO revenue (amount, source, staff , week_day, month, year, createdby, createddate) values (?,?,?,?,?,?,?,?)";
        connection.query(query, [req.body.amount, req.body.source,  req.body.staff,  req.body.week_day, req.body.month,req.body.year, req.body.createdby, createddate], function (err, result) {
            if (err) {
                // console.log({err});
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    });


    router.post('/carousel/new', (req, res) => {
        const time = new Date()
        const query = "INSERT INTO carousel (image, main_caption, min_caption, createdby, createddate) value ('" + req.body.image + "', '" + req.body.main_caption + "', '" + req.body.min_caption + "', '" + req.body.createdby + "', '" + time + "',)";
        connection.query(query, function (err) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    });

    router.post('/carousel/update', (req, res) => {
        const query = "UPDATE carousel set image=?, main_caption=?, min_caption=? where id=?";
        connection.query(query, [req.body.image, req.body.main_caption, req.body.min_caption, req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    });


    router.post('/checkAvailability', (req, res) => {

        const check = 'SELECT * from products where item_name=? and id=?';
        //// console.log(req.body);
        connection.query(check, [req.body.item_ordered, req.body.id], (err, result) => {
            if (err) {
                res.send(err);
            } else {

                //// console.log(result);

                if (result.length > 0) {
                    if (result[0]['item_quantity'] >= req.body.item_quantity) {
                        const message = {
                            'message': 'success'
                        }
                        res.send(message);

                    } else {
                        const message = {
                            'status': 'failed'
                        }
                        res.send(message);

                    }
                } else {
                    if (req.body.id === 'gift-001') {
                        const message = {
                            'message': 'success'
                        }
                        res.send(message);

                    }
                }

            }

        })


    })

    router.post('/orders/new', (req, res) => {


        req.body.client_phone_number =  req.body.client_phone_number;
        const createddate = new Date();
        const string = createddate.toISOString()

        let hex = '';

        for (let i = 0; i < string.length; i++) {
            hex += '' + string.charCodeAt(i).toString(16);

            if (i === string.length - 1) {
                const query = "INSERT INTO orders (order_id, number_of_items, delivery_fee, amount, client_name, date_due, status, delivery_address, client_phone_number , transaction_ref, createddate) values (?,?,?,?,?,?,?,?,?,?,?)";
                connection.query(query, [hex ,req.body.number_of_items, req.body.delivery_fee ,req.body.amount ,req.body.customer_name, req.body.date_due, req.body.status , req.body.delivery_address , req.body.client_phone_number , req.body.transaction_ref , createddate], (err, order) => {
                    if (err) {
                        res.send(err);
                    } else {

                        req.body.items.forEach(element => {
                            const orderdetail = "INSERT INTO orderdetails(order_id, item_ordered, item_quantity, item_price, createddate) values (?, ?, ?, ?, ?)"
                            connection.query(orderdetail, [ hex , element.item_ordered , element.item_quantity ,element.item_price, createddate], (err, result) => {
                                if (err) {
                                    //// console.log(err)
                                } else {

                                    if (element.id === "gift-001") {
                                        for( let j = 0 ; j < element.item_quantity; j++){
                                           createGiftCardEntry(element, j, req);
                                        }
                                    } else {
                                        const inventory = 'SELECT * from products where id=?';
                                        connection.query(inventory, [element.id], (err, result) => {
                                            if (err) {
                                                res.send(err);
                                            } else {

                                                const item_quantity = +result[0].item_quantity - +element.item_quantity;
                                                const quantity_sold = +result[0].quantity_sold + +element.item_quantity;

                                                const update = "UPDATE products set item_quantity=?,quantity_sold=? where id=?";
                                                connection.query(update, [item_quantity, quantity_sold, element.id]);

                                            }
                                        })
                                    }
                                }
                            });
                        });

                        const rev = +req.body.amount + +req.body.delivery_fee;
                        const revenueEntry = "INSERT INTO revenue (amount, source, staff, description,week_day, month, year, createdby, createddate) values (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        connection.query(revenueEntry, [rev, req.body.source,  'WEB', ' Revenue Entry for Order '  + hex , req.body.week_day, req.body.month, req.body.year, 'WEB', createddate], (err, result) => {
                            if(err){
                                // console.log({err})
                            }else{
                                // console.log(result);
                            }
                        });
                        const customerCheck = 'Select * from customers where customer_phone_number = ? and customer_email = ?';
                        connection.query(customerCheck, [req.body.client_phone_number, req.body.customer_email], (err, result) => {
                            if (err) {
                                // console.log(err)
                            } else if (result.length === 0) {
                                const customer = "INSERT INTO customers (customer_name, customer_email, customer_phone_number, source, number_of_orders) values ('" + req.body.customer_name + "', '" + req.body.customer_email + "', '" + req.body.client_phone_number + "', '" + req.body.source + "', ?)";
                                connection.query(customer, [1], (err, result) => {
                                    // console.log({err})
                                    // console.log({result})
                                });
                            } else {
                                const noo = result[0].number_of_orders + 1;
                                const id = result[0].id
                                const update = 'Update customers set number_of_orders =' + noo + ' where id =' + id;
                                connection.query(update, [noo, id]);
                            }
                        })


                        let order = {
                            ...req.body,
                            'order_id': hex,
                            'createddate': createddate,
                            sub_total: (req.body.amount - req.body.delivery_fee),
                            order_status: 'is currently being prepared'
                        }

                        updateOrder(order)

                        const message = {
                            "message": "Success",
                            'order_details': hex
                        };
                        res.send(message);

                    }
                })
            }

        }


    });

    router.post('/newsletter', (req, res) => {
        const customerCheck = 'Select * from customers where customer_phone_number = ? or customer_email = ?';
        connection.query(customerCheck, [req.body.client_phone_number, req.body.customer_email], (err, result) => {
            if (err) {
                res.send(err)
            } else if (result.length === 0) {
                const customer = "INSERT INTO customers (customer_name, customer_email, customer_phone_number, source, number_of_orders) values (?,?,?,?,?)";
                connection.query(customer, [req.body.customer_name,req.body.customer_email,req.body.client_phone_number, 'Newsletter' , 0], (err, result) => {
                   if(!err){
                       const message = {
                           'message': 'success'
                       }
                       generateNewsLetterGiftCard(req.body);
                       res.send(message);
                   }else{
                       res.send(err)
                   }
                });
            } else {
                const message = {
                    status: 2,
                    message: 'Sorry, You are not eligible for this offer'
                }
                res.send(message);
            }
        })
    })

    router.post('/order/status/update', (req, res) => {
        const query = "UPDATE orders set status=? where id=?";
        connection.query(query, [req.body.status, req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    })

    router.post('/user/account/update', (req, res) => {
        const query = "UPDATE users set password=? where id=?";
        connection.query(query, [req.body.password, req.body.user_id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    })

    router.post('/staff/create-new', upload.single('staff_avatar'), (req, res) => {
        const date = new Date();
        const query = "INSERT INTO staff (staff_name, staff_avatar, staff_bio, staff_category, commission_rate, contact ,createdby, createddate) values ('" + req.body.staff_name + "', 'uploads/" + req.file.filename + "', '" + req.body.staff_bio + "', '" + req.body.staff_category + "', '" + req.body.commission_rate + "', '" + req.body.contact + "',  '" + req.body.createdby + "', '" + date + "') ";
        connection.query(query, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                //// console.log(result);
                const message = {"message": "Success"};
                res.send(message);

            }
        })
    })

    router.post('/user/create-new', (req, res) => {
        //// console.log(req.body);
        req.body.createddate = new Date(req.body.createddate).getTime();
        const query = "INSERT INTO users (username, full_name, title, password, user_type, createdby) values ('" + req.body.username + "', '" + req.body.full_name + "', '" + req.body.title + "', '" + req.body.password + "', '" + req.body.usertype + "', '" + req.body.createdby + "') ";
        connection.query(query, function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    })

    router.post('/user/delete', (req, res) => {
        const query = "DELETE FROM users where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    });

    router.post('/carousel/delete', (req, res) => {
        const query = "DELETE FROM carousel where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    });

    router.post('/categories/merch-delete', (req, res) => {
        const query = "DELETE FROM productcategories where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {"message": "Success"};
                res.send(message);

            }
        })
    });

    router.post('/sources/revenue-delete', (req, res) => {
        const query = "DELETE FROM revenuesources where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {"message": "Success"};
                res.send(message);

            }
        })
    });

    router.post('/sources/expenses-delete', (req, res) => {
        const query = "DELETE FROM expensesources where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {"message": "Success"};
                res.send(message);

            }
        })
    });

    router.post('/services/delete', (req, res) => {
        const query = "DELETE FROM services where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {"message": "Success"};
                res.send(message);

            }
        })
    });

    router.post('/merch/restock', (req, res) => {
        //// console.log(req.body)
        const update = "UPDATE products set item_quantity=? where id=?";
        connection.query(update, [req.body.item_quantity, req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {"message": "Success"};
                res.send(message);

            }
        })
    })

    router.post('/merch/delete', (req, res) => {
        const query = "DELETE FROM products where id = ?";
        connection.query(query, [req.body.id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    })


    router.post('/mail/new', (req, res) => {
        const date = new Date()
        const query = "INSERT INTO messages(sender, subject, content, status, createdby, createddate, order_id) values(?, ?, ?, ?, ?, ?, ?) ";
        connection.query(query, [req.body.name, req.body.subject, req.body.message, req.body.status, req.body.name, date, req.body.order_id],  (err, result) => {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    })

    router.post('/merch/create-new', upload.array('images', 3), (req, res, err) => {

        const time = new Date();
        const query = "INSERT INTO products (item_name, item_avatar, item_avatar2, item_avatar3, item_quantity, old_price, item_price, item_category, item_description, item_design, item_color, item_metal, is_new_arrival, quantity_sold ,createdby, createddate) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ";

        switch (req.files.length) {
            case 1:
                connection.query(query, [ req.body.item_name , req.files[0].buffer.toString('base64') , null,  null,  req.body.item_quantity , 0,  req.body.item_price ,  req.body.item_category ,  req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, '0' ,  req.body.createdby ,  time ],  (err, result) => {
                    if (err) {
                        res.send(err);
                    } else {
                        const message = {
                            "message": "Success"
                        };
                        res.send(message);
                    }
                })
                break;
            case 2:
                connection.query(query, [ req.body.item_name , req.files[0].buffer.toString('base64') , req.files[1].buffer.toString('base64')  , null  ,  req.body.item_quantity , 0,  req.body.item_price ,  req.body.item_category ,  req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, '0' ,  req.body.createdby ,  time ],  (err, result) => {
                    if (err) {
                        res.send(err);
                    } else {
                        const message = {
                            "message": "Success"
                        };
                        res.send(message);
                    }
                })
                break;
            case 3:
                connection.query(query, [ req.body.item_name , req.files[0].buffer.toString('base64') , req.files[1].buffer.toString('base64')  , req.files[2].buffer.toString('base64')  ,  req.body.item_quantity , 0,  req.body.item_price ,  req.body.item_category ,  req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, '0' ,  req.body.createdby ,  time ],  (err, result) => {
                    if (err) {
                        res.send(err);
                    } else {
                        const message = {
                            "message": "Success"
                        };
                        res.send(message);
                    }
                })
                break;
            default:
                const message = {
                    "message": "Please add an image"
                };
                res.send(message);
                break;
        }



    })

    router.post('/merch/edit', upload.array('images', 3), (req, res, err) => {
        const time = new Date();
        connection.query('Select item_price from products where id=?', [req.body.item_id], (err, result) => {
            if(err){
                res.send(err)
            }else{
                let old_price = 0
                if(result[0].item_price !== req.body.item_price){ old_price = result[0].item_price }

                let update_query = '';

                switch (req.files.length){

                    case 1:
                        update_query = "Update products set item_name = ?, old_price = ?, item_price = ?, item_category = ?, item_description = ?, item_design = ?, item_metal = ?, item_color = ?, is_new_arrival = ?, item_avatar = ? , item_avatar2 = ?, item_avatar3 = ? where id = ?";
                        connection.query(update_query, [req.body.item_name, old_price, req.body.item_price, req.body.item_category, req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, req.files[0].buffer.toString('base64'), null, null, req.body.item_id], (err, result) => {
                            if (err) {
                                res.send(err);
                            } else {
                                const message = {
                                    "message": "Success"
                                };
                                res.send(message);

                            }
                        })
                        break;
                    case 2:
                        update_query = "Update products set item_name = ?, old_price = ?, item_price = ?, item_category = ?, item_description = ?, item_design = ?, item_metal = ?, item_color = ?, is_new_arrival = ?, item_avatar = ? , item_avatar2 = ?, item_avatar3 = ? where id = ?";
                        connection.query(update_query, [req.body.item_name, old_price, req.body.item_price, req.body.item_category, req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, req.files[0].buffer.toString('base64'), req.files[1].buffer.toString('base64'), null, req.body.item_id], (err, result) => {
                            if (err) {
                                res.send(err);
                            } else {
                                const message = {
                                    "message": "Success"
                                };
                                res.send(message);

                            }
                        })
                        break;
                    case 3:
                        update_query = "Update products set item_name = ?, old_price = ?, item_price = ?, item_category = ?, item_description = ?, item_design = ?, item_metal = ?, item_color = ?, is_new_arrival = ?, item_avatar = ? , item_avatar2 = ?, item_avatar3 = ? where id = ?";
                        connection.query(update_query, [req.body.item_name, old_price, req.body.item_price, req.body.item_category, req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, req.files[0].buffer.toString('base64'), req.files[1].buffer.toString('base64'), req.files[2].buffer.toString('base64'), req.body.item_id], (err, result) => {
                            if (err) {
                                res.send(err);
                            } else {
                                const message = {
                                    "message": "Success"
                                };
                                res.send(message);

                            }
                        })
                        break;
                    default:
                        update_query = "Update products set item_name = ?, old_price = ?, item_price = ?, item_category = ?, item_description = ?, item_design = ?, item_metal = ?, item_color = ?, is_new_arrival = ?  where id = ?";
                        connection.query(update_query, [req.body.item_name, old_price, req.body.item_price, req.body.item_category, req.body.item_description, req.body.item_design, req.body.item_color, req.body.item_metal, req.body.is_new_arrival, req.body.item_id], (err, result) => {
                            if (err) {
                                res.send(err);
                            } else {
                                const message = {
                                    "message": "Success"
                                };
                                res.send(message);

                            }
                        })
                        break;
                }

            }
        })

    })

    router.post('/carousel/create-new', upload.array('image', 1), (req, res, err) => {
        //// console.log(req.files)
        const time = new Date();
        const query = "INSERT INTO carousel (image, main_caption, min_caption, createdby, createddate) values (?,?,?,?,?) ";
        connection.query(query, [ req.files[0].buffer.toString('base64'), req.body.main_caption, req.body.min_caption, req.body.createdby, time]  ,(err, result) => {
            if (err) {
                res.send(err);
            } else {
                const message = {
                    "message": "Success"
                };
                res.send(message);

            }
        })
    })

    router.post('/categories/merch-new', (req, res) => {
        const query = "SELECT * from productcategories where category_name = ?";
        connection.query(query, [req.body.category_name], function (err, result) {
            if (err) {
                res.send(err);
            } else if (result.length > 0) {
                const message = {
                    "message": "THIS CATEGORY ALREADY EXISTS"
                };
                res.send(message);
            } else {
                const time = new Date();
                connection.query("INSERT INTO productcategories(category_name, createdby, createddate) values (?, ?, ?)",  [req.body.category_name, req.body.username, time] ,(err, result) => {
                    if(err){
                        res.send(err);
                    }else{
                        const message = {
                            "message": "Success"
                        };
                        res.send(message);
                    }
                })


            }
        })
    })

    router.post('/sources/revenue-new', (req, res) => {
        const query = "SELECT * from revenuesources where source = ?";
        connection.query(query, [req.body.source], function (err, result) {
            if (err) {
                res.send(err);
            } else if (result.length > 0) {
                const message = {
                    "message": "THIS SOURCE ALREADY EXISTS"
                };
                res.send(message);

            } else {
                const time = new Date();
                req.body.createddate = time;
                connection.query("INSERT INTO revenuesources(source, createdby, createddate) values (?, ?, ?)", [req.body.source, req.body.username, time], (err, result) => {
                    if(err){
                        res.send(err)
                    }else{
                        const message = {
                            "message": "Success"
                        };
                        res.send(message);
                    }
                })


            }
        })
    })

    router.post('/sources/expenses-new', (req, res) => {
        const query = "SELECT * from expensesources where source = ?";
        connection.query(query, [req.body.source], function (err, result) {
            if (err) {
                res.send(err);
            } else if (result.length > 0) {
                const message = {
                    "message": "THIS SOURCE ALREADY EXISTS"
                };
                res.send(message);

            } else {
                //// console.log(req.body)
                const time = new Date();
                connection.query("INSERT INTO expensesources(source, createdby, createddate) values (?, ?, ?)", [req.body.source, req.body.username, time], (err, result) => {
                    if(err){
                        res.send(err)
                    }else{
                        const message = {
                            "message": "Success"
                        };
                        res.send(message);
                    }
                })

            }
        })
    })


    router.post('/discount/update', (req, res) => {
        const query = "SELECT * from giftcards where id = ?";
        connection.query(query, [req.body.code_id], function (err, result) {
            if (err) {
                res.send(err);
            } else {
                if (result.length > 0) {

                    const notu = +result[0].number_of_times_used + 1;
                    const balance = result[0].amount_left - req.body.amount_used;
                    const update = "UPDATE giftcards set number_of_times_used=?,amount_left=? where id=?";
                    connection.query(update, [notu, balance, result[0].id]);
                    const message = {
                        'status': 1,
                        'message': 'Update Successful'
                    }
                    res.send(message);

                } else {
                    const message = {
                        'status': 1,
                        'message': 'Update Successful'
                    }
                    res.send(message);

                }
            }
        })
    })

    }
    
})

module.exports = router;

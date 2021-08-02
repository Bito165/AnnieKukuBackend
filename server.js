        // Get dependencies
        const express = require('express');
        const path = require('path');
        const http = require('http');
        const sql = require('mysql');
        const bodyParser = require('body-parser');

        // Get our API routes
        const api = require('./endpoints/api');

        const app = express();

        // const pool = sql.createPool({
        //     connectionLimit: 1000000,
        //     host: '127.0.0.1',
        //     user: 'root',
        //     password: '',
        //     database: 'anniekuku',
        //     multipleStatements: true
        // });

        // const pool = sql.createPool({
        //     connectionLimit: 1000000,
        //     connectTimeout  : 60 * 60 * 1000,
        //     acquireTimeout  : 60 * 60 * 1000,
        //     timeout         : 60 * 60 * 1000,
        //     host: '23.94.16.6',
        //     user: 'anniekuk_data',
        //     password: 'Allforanniekuku007$',
        //     database: 'anniekuk_database',
        //     port: 3360,
        //     multipleStatements: true
        // });

        // const pool = sql.createPool('mysql://anniekuk_data:Allforanniekuku007$@23.94.16.6:3360/anniekuk_database?sslrootcert=rds-combined-ca-bundle.pem&sslmode=require');


        const pool = sql.createPool({
            connectionLimit: 1000000,
            host: 'r6ze0q02l4me77k3.chr7pe7iynqr.eu-west-1.rds.amazonaws.com',
            port: '3306',
            user: 'cq7bslzg89bzf3rl',
            password: 'v1kjmgf770pbvt4s',
            database: 'wn9v9fnyzffqn302',
            multipleStatements: true
        });


        pool.getConnection((err, connection) => {

            if (err){
                console.log(process.env.DATABASE_URL);
                console.log({err})
            }else{

            setInterval(() => {
                connection.query('SELECT 1', function (err, res) {
                    if (err) {
                        connection.release();
                    }
                });
            }, 1000);

            connection.query('CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, item_name VARCHAR(255), item_avatar LONGTEXT,item_avatar2 LONGTEXT, item_avatar3 LONGTEXT, old_price INT, item_price INT, item_category VARCHAR(255), item_quantity VARCHAR(255), quantity_sold VARCHAR(255),  item_description VARCHAR(255), createdby VARCHAR(255), createddate DATE)', (err, result) => {
                if (err) throw err;
            });


            connection.query('CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, order_id VARCHAR(255), delivery_fee INT, amount INT ,number_of_items INT ,client_name VARCHAR(255), date_due VARCHAR(255), status INT, delivery_address VARCHAR(255), client_phone_number VARCHAR(255), transaction_ref VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS orderdetails (id INT AUTO_INCREMENT PRIMARY KEY, order_id VARCHAR(255), item_ordered VARCHAR(255), item_quantity INT, item_price INT, createddate DATE)',  (err, result) => {
                if (err) throw err;
            });


            connection.query('CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, customer_name VARCHAR(255), customer_phone_number VARCHAR(255), customer_email VARCHAR(255), source VARCHAR(255), number_of_orders INT, createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, sender VARCHAR(255), subject VARCHAR(255), content VARCHAR(255), status VARCHAR(255) ,createdby VARCHAR(255), createddate DATE, order_id VARCHAR(255))', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS revenue (id INT AUTO_INCREMENT PRIMARY KEY, amount VARCHAR(255), source VARCHAR(255), staff VARCHAR(255), week_day VARCHAR(255), month VARCHAR(255), year VARCHAR(255), description VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS expenses (id INT AUTO_INCREMENT PRIMARY KEY, amount VARCHAR(255), source VARCHAR(255), week_day VARCHAR(255), month VARCHAR(255), year VARCHAR(255), description VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), full_name VARCHAR(255), title VARCHAR(255), password VARCHAR(255), last_login VARCHAR(255), user_type VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;

            });


            connection.query('CREATE TABLE IF NOT EXISTS productcategories (id INT AUTO_INCREMENT PRIMARY KEY, category_name VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;

            });

            connection.query('CREATE TABLE IF NOT EXISTS revenuesources (id INT AUTO_INCREMENT PRIMARY KEY, source VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS expensesources (id INT AUTO_INCREMENT PRIMARY KEY, source VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS carousel (id INT AUTO_INCREMENT PRIMARY KEY, image LONGTEXT, main_caption VARCHAR(255), min_caption VARCHAR(255), createdby VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

            connection.query('CREATE TABLE IF NOT EXISTS giftcards (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(255), amount_left VARCHAR(255), number_of_times_used VARCHAR(255), createddate DATE)', function (err, result) {
                if (err) throw err;
            });

        }

        })


        // Parsers for POST data
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));

        // Point static path to dist

        app.use('/uploads/', express.static(path.join(__dirname, '/uploads/')));

        console.log(__dirname);

        app.use(express.static(path.join(__dirname, 'dist')));

        app.use(function (req, res, next) {

            // Website you wish to allow to connect

            res.setHeader('Access-Control-Allow-Origin', '*');

            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,enctype, content-type');

            res.setHeader('Encytype', 'multipart/form-data');

            res.setHeader('Content-Type', 'multipart/form-data');

            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);

            // Pass to next layer of middleware
            next();
        });

        // Set our api routes
        app.use('/api', api);

        // Catch all other routes and return the index file
        // app.get('*', (req, res) => {
        //   res.sendFile(path.join(__dirname, 'dist/index.html'));
        // });

        /**
         * Get port from environment and store in Express.
         */
        const port = '1011';
        app.set('port', port);

        /**
         * Create HTTP server.
         */
        const server = http.createServer(app);

        /**
         * Listen on provided port, on all network interfaces.
         */
        server.listen(port, () => console.log(`API running on localhost:${port}`));

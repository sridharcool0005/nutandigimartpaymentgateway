const { initPayment, responsePayment } = require("../paytm/services/index");

var mysql = require('mysql');

const request = require('request');

var db1 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test',
    debug: false,
});

var db2 = mysql.createConnection({
    host: 'localhost',
    user: 'dbserver_nutandm',
    password: 'zchipern*h68Gh',
    database: 'dbserver_nutandm',
    debug: false,

});
const util = require('util');
const query = util.promisify(db2.query).bind(db2);

module.exports.getOrderConfirm = async function (req, res) {
    const { agent_id, order_id } = req.query;
    const smsportal_authkey = req.headers['authorization'];
    if (!agent_id || !order_id) {
        res.status(400).send({
            message: "please make sure fields are mandatory",
            status: "error"
        })
    } else if (!smsportal_authkey) {
        res.status(400).send({
            message: "please make sure smsportal_authkey is mandatory",
            status: "error"
        })

    } else {

        const query1 = "SELECT `smsportal_authkey` FROM `app_clients_master` WHERE `agent_id` =?"
        await db1.query(query1, [agent_id], function (err, response, fields) {
            if (!response.length) {
                res.status(400).send({
                    status: "error",
                    message: 'authentication failed'
                });
            } else {
                const authkey = response[0].smsportal_authkey;
                if (authkey === smsportal_authkey) {
                    res.send({
                        status: "success",
                        paygateway_url: 'http://payment.nutanapp.in/' + order_id

                    });
                }
                else {
                    res.status(400).send({
                        status: "error",
                        message: 'authentication failed'
                    });
                }
            }
        });
    }
}


module.exports.paywithpaytm = async function (req, res) {
    const { amount, order_id } = req.body;
    console.log(amount, order_id)
    initPayment(amount, order_id).then(
        success => {
            console.log(success)
            res.render("paytmRedirect.ejs", {
                resultData: success,

                paytmFinalUrl: process.env.PAYTM_FINAL_URL
            });
        },
        error => {
            res.send(error);
        }
    );
}


module.exports.paywithpaytmresponse = async function (req, res) {
    responsePayment(req.body).then(
        success => {
            console.log(req.body)
            postpaymentTransaction(req.body);
            res.render("response.ejs", { resultData: "true", responseData: success, link: "https://nutandigitalmart.com/paymentsucess/" + req.body.ORDERID });
        },
        error => {
            res.send(error);
        }
    );
}

const postpaymentTransaction = async (_result) => {
    const data = _result;
    const updatequery = "UPDATE portal_sales_history SET ? where order_id =? ";
    const postvalues = {
        payment_gateway_txn_id: data.TXNID,
        total_amount_paid: data.TXNAMOUNT,
        payment_mode: data.PAYMENTMODE,
        payment_status: data.STATUS,
        payment_status_code: data.RESPCODE,
        payment_resp_msg: data.RESPMSG,
        gatewayname: data.GATEWAYNAME,
        bank_txn_id: data.BANKTXNID,
        bankname: data.BANKNAME,
    }
    console.log(postvalues)


    await query(updatequery, [postvalues, data.ORDERID]);

    ////****update expiry date**************** */
    const fetchpackdetails = "select a.client_id,a.order_id,b.client_category, c.package_validity_in_months, b.profile_id, b.email from portal_sales_history a, app_clients_master b, portal_premiumplans_master c where a.order_id =? and a.client_id=b.client_id and a.package_id=c.package_id;"
    const result = await query(fetchpackdetails, [data.ORDERID]);
    const client_id = result[0].client_id;
    const validity = result[0].package_validity_in_months
    const client_category = result[0].client_category;
    // var date = new Date();
    // date.setMonth(date.getMonth() + validity);
    // console.log(date)
    const updatequery2 = "UPDATE app_clients_master  SET ? where client_id =?";
    let expiryDate = '0000/00/00 00:00';
    if (client_category == 'vcard') {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getMonth() + validity);
    }
    let ws_expiry_date = '0000/00/00 00:00';
    if (client_category == 'ws') {
        ws_expiry_date = new Date();
        ws_expiry_date.setDate(ws_expiry_date.getMonth() + validity);
    }

    let dc_expiry_date = '0000/00/00 00:00';
    if (client_category == 'dc') {
        dc_expiry_date = new Date();
        dc_expiry_date.setDate(dc_expiry_date.getMonth() + validity);
    }

    const values = {
        expiry_date: expiry_date,
        ws_expiry_date: ws_expiry_date,
        dc_expiry_date: dc_expiry_date
    }

    await query(updatequery2, [values, client_id]);

}


module.exports.getorderDetails = async (req, res) => {

    const orderIdApi = 'https://portalapi.nutansms.in/fetchOrderdetailsV1.php';

    const { order_id } = req.body;
    const options = {
        url: orderIdApi,
        qs: { order_id: 'autosms/' + order_id },
        headers: {
            'Authorization': 'nh7bhg5f*c#fd@sm9'
        },

        json: true,
        method: 'Post',
    }
    console.log(options)
    request(options, (err, response, body) => {
        // console.log(err)
        // console.log(response)
        console.log(body)

        if (err) {
            res.json(err)
        } else {
            res.json(body)

        }
    });

}




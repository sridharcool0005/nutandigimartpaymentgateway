const {initPayment, responsePayment} = require("../paytm/services/index");

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
    user: 'smsdba_smsdba2',
    password: 'nnv9I^b7KantGk',
    database: 'smsdba_ntsmsdb',
    debug: false,
  
  });


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
        await db1.query(query1,[agent_id], function (err, response, fields) {
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
                        paygateway_url:'http://payment.nutanapp.in/'+order_id

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


module.exports.paywithpaytm = async function (req, res){
const {amount,order_id}= req.body;
console.log(amount,order_id)
    initPayment(amount,order_id).then(
        success => {
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

            res.render("response.ejs", {resultData: "true", responseData: success});
        },
        error => {
            res.send(error);
        }
    );
}



const postpaymentTransaction = (_result) => {
    const data=_result;
    const query = "UPDATE portal_sales_history SET ? where order_id =? ";
    const postvalues = {
    mid:data.MID,
    payment_gateway_txn_id:data.TXNID,
    total_amount_paid:data.TXNAMOUNT,
    payment_mode:data.PAYMENTMODE,
    payment_status:data.STATUS,
    payment_status_code:data.RESPCODE,
    notes:data.RESPMSG,
    gatewayname:data.GATEWAYNAME,
    bank_txn_id:data.BANKTXNID,
    bankname:data.BANKNAME,
  }
  console.log(postvalues)
  db1.query(query, [postvalues,data.ORDERID], function (err, result, fields) {
      if (err) throw err;
    
  })
  }
  

module.exports.getorderDetails = async (req, res) => {

    const orderIdApi='https://portalapi.nutansms.in/fetchOrderdetailsV1.php';
 
    const { order_id} = req.body;
    const options = {
      url: orderIdApi,
      qs: { order_id: 'autosms/'+order_id},
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




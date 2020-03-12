const Customers = require('../models/customers')
const Locals = require('../models/locals')
exports.aggregateStatusLocalsCustomers = (req, res) => {
    Customers.updateMany({}, {status :"READY"})
    .exec((_err, customers) => {
        Locals.updateMany({}, {status :"READY"})
        .exec((_err, locals) => {
            return res.status(200).send({customers, locals})
        })
    })
} 

exports.aggregateCusmerIDToLocal = (req, res) => {
    Customers.find().exec((_err, customers) => {
        var ids = []
        customers.forEach(element => {
            element.localsID.forEach(ele => {
                ids.push(ele)
            }) 
        })
        Locals.find().exec((_err, locals) => {
            locals.forEach(local => {
                customers.forEach(customer => {
                    for(let i = 0; i < customer.localsID.length; i++){
                        if(String(local._id) === String(customer.localsID[i])){
                            local.customerID = customer._id
                            local.save()
                        }
                    }
                })
            })
            return res.status(200).send()
        })
    })
} 
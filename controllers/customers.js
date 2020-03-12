const Customers = require('../models/customers')
const Locals = require('../models/locals')

exports.create = (req, res) => {
    var data = req.body

    Customers.create(data.customer, (_err, customer) => {
        if(customer){
            data.locals = data.locals.map(local => {
                return {
                    ...local,
                    customerID: customer._id
                }
            })
            Locals.create(data.locals, (_err, locals) => {
                if(locals){
                    customer.localsID = locals.map(local => local._id)
                    customer.save()
                    return res.status(200).send(customer)
                } else {
                    return res.status(400).send()
                }
            })
        } else {
            return res.status(400).send()
        } 
    })
}

exports.retrieve = (req, res) => {
    const data = req.query

    Customers
        .find()
        .populate('localsID')
        .exec((_err, customer) => {
            if(customer){
                console.log(customer)
                return res.status(200).send(customer)
            } else {
                return res.status(404).send()
            }
        })
}
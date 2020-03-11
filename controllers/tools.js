const Customers = require('../models/costumers')
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
const bcrypt = require('bcryptjs')

const hashing = (pass) => {
  var salt = bcrypt.genSaltSync(10)
  var hash = bcrypt.hashSync(pass, salt)
  return {
    hash: hash,
    pass: pass
  }
}
exports.generate = () => {
  const pass = Math.floor(Math.random() * 900000) + 100000 + 'Ac'
  return hashing(pass)
}
exports.hash = (pass) => {
  return hashing(pass.toString())
}
exports.compare = (pass, hash) => {
  return bcrypt.compareSync(pass, hash)
}

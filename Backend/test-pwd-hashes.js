const bcrypt = require('bcrypt');

const hash = '$2b$10$HkL598O.g.6LlR5cfjo6oOp5lDcHvyheOm2QY6NW7QtdUJybI2Uyy';

const passwords = ['adm210', 'ani211', 'sal999', 'admin', 'operator', 'password', 'SYS001', 'ADMIN001', '123456', '1234'];

async function test() {
  for (const pwd of passwords) {
    const match = await bcrypt.compare(pwd, hash);
    if (match) {
      console.log(`FOUND! Password is: ${pwd}`);
      return;
    }
  }
  console.log('No matches found in list');
}

test();

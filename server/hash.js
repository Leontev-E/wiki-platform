import bcryptjs from 'bcryptjs';

async function hashPassword() {
    const password = process.argv[2];

    if (!password) {
        console.error('Usage: node hash.js <plain-text-password>');
        console.error('Provide the password you want to hash as a command argument instead of hardcoding it.');
        process.exit(1);
    }

    const hash = await bcryptjs.hash(password, 10);
    console.log(hash);
}

hashPassword();

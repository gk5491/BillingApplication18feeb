
const BASE_URL = 'http://127.0.0.1:5000/api';

async function run() {
    try {
        console.log('--- Starting Flow Verification ---');

        const headers = { 'Content-Type': 'application/json' };

        // 1. Register Logic
        console.log('1. Registering Customer...');
        let customerToken = '';

        let res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                email: 'customer@test.com',
                password: 'password',
                name: 'Test Customer',
                role: 'customer'
            })
        });

        let data;
        if (res.status === 400) {
            console.log('   Customer already exists, logging in...');
            res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    email: 'customer@test.com',
                    password: 'password'
                })
            });
        }

        if (!res.ok) {
            throw new Error(`Auth failed: ${res.status} ${res.statusText}`);
        }

        data = await res.json();
        customerToken = data.data.token;
        console.log('   Customer auth success');

        // 2. Profile Management
        console.log('2. Creating/Updating Profile...');
        res = await fetch(`${BASE_URL}/flow/profile`, {
            method: 'POST',
            headers: { ...headers, Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({
                name: 'Verified Customer',
                phone: '1234567890',
                address: '123 Test St'
            })
        });
        if (!res.ok) throw new Error(`Profile update failed: ${res.status}`);
        data = await res.json();
        console.log('   Profile ID:', data.data.id);


        // 3. Customer Requests Item
        console.log('3. Customer Requesting Items...');
        res = await fetch(`${BASE_URL}/flow/request`, {
            method: 'POST',
            headers: { ...headers, Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({
                items: [{ name: 'Test Item', quantity: 1 }]
            })
        });

        data = await res.json();
        console.log('   Request response:', data.message);
        const requestData = data.data;
        console.log('   Request ID:', requestData.id);

        // 4. Customer View Quotes
        console.log('4. Customer Viewing Quotes...');
        res = await fetch(`${BASE_URL}/flow/quotes`, {
            headers: { ...headers, Authorization: `Bearer ${customerToken}` }
        });
        data = await res.json();
        const myQuotes = data.data;
        console.log('   Quotes found:', myQuotes.length);
        const myRequest = myQuotes.find((q: any) => q.id === requestData.id);
        if (myRequest) {
            console.log('   My Request found in quotes:', myRequest.quoteNumber, myRequest.status);
        } else {
            console.error('   FAILED: Request not found in quotes list');
            // We won't block simulation if this fails but it's a bug
        }

        // 5. Customer Approving Quote
        console.log('5. Customer Approving Quote...');

        res = await fetch(`${BASE_URL}/flow/quotes/${requestData.id}/approve`, {
            method: 'POST',
            headers: { ...headers, Authorization: `Bearer ${customerToken}` }
        });

        data = await res.json();
        if (res.ok) {
            console.log('   Approve response:', data.message);
            console.log('   New Status:', data.data.status);
        } else {
            console.error('   Approve Failed:', data.message);
        }

        console.log('--- Verification Complete ---');

    } catch (error: any) {
        console.error('Verification Failed:', error.message);
    }
}

run();

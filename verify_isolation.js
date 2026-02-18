const BASE_URL = "http://localhost:5000";

async function run() {
    try {
        console.log("Starting Data Isolation Verification...");

        // 1. Create Org
        console.log("Creating Test Org...");
        const orgRes = await fetch(`${BASE_URL}/api/organizations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test Org Isolation", industry: "Technology" })
        });

        if (!orgRes.ok) {
            throw new Error(`Failed to create org: ${orgRes.statusText}`);
        }

        const org = await orgRes.json();
        if (!org.success) throw new Error("Failed to create org response");
        const orgId = org.data.id;
        console.log(`Created Org ID: ${orgId}`);

        // 2. Create Item in Test Org
        console.log("Creating Item in Test Org...");
        const itemRes = await fetch(`${BASE_URL}/api/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-organization-id": orgId
            },
            body: JSON.stringify({ name: "Isolation Test Item", sellingPrice: 100, purchasePrice: 50 })
        });

        if (!itemRes.ok) {
            throw new Error(`Failed to create item: ${itemRes.statusText}`);
        }

        const item = await itemRes.json();
        console.log(`Created Item ID: ${item.id}`);

        // 3. Verify Item in Test Org
        console.log("Verifying Item in Test Org...");
        const listRes = await fetch(`${BASE_URL}/api/items`, {
            headers: { "x-organization-id": orgId }
        });
        const list = await listRes.json();
        const found = list.find(i => i.id === item.id);
        if (found) console.log("SUCCESS: Item found in Test Org");
        else console.error("FAILURE: Item NOT found in Test Org");

        // 4. Verify Item NOT in Default Org
        console.log("Verifying Item NOT in Default Org...");
        const defaultListRes = await fetch(`${BASE_URL}/api/items`, {
            headers: { "x-organization-id": "1" }
        });
        const defaultList = await defaultListRes.json();
        const foundInDefault = defaultList.find(i => i.id === item.id);
        if (!foundInDefault) console.log("SUCCESS: Item NOT found in Default Org");
        else console.error("FAILURE: Item FOUND in Default Org (Leak!)");

        // 5. Cleanup
        console.log("Cleaning up...");
        await fetch(`${BASE_URL}/api/organizations/${orgId}`, {
            method: "DELETE"
        });
        console.log("Done.");

    } catch (e) {
        console.error("Error:", e);
    }
}

run();

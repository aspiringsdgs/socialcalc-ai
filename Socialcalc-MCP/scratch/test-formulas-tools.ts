import { SocialcalcMcpServer } from "../src/server.js";

async function runTests() {
  console.log("Starting verification of new formula helper tools...");
  const server = new SocialcalcMcpServer();

  // 1. Test get_formulas
  console.log("\n1. Testing 'get_formulas' (all)...");
  let res = await server.executeTool("get_formulas", {});
  console.log("Response starts with:\n", res.content[0].text.substring(0, 300) + "...\n");
  if (res.isError || !res.content[0].text.includes("SUM") || !res.content[0].text.includes("AVERAGE")) {
    throw new Error("get_formulas (all) failed");
  }

  // 2. Test get_formulas with category
  console.log("\n2. Testing 'get_formulas' with category 'Statistical'...");
  res = await server.executeTool("get_formulas", { category: "Statistical" });
  console.log("Response:\n", res.content[0].text.substring(0, 300) + "...\n");
  if (res.isError || !res.content[0].text.includes("SUM") || res.content[0].text.includes("ACOS")) {
    throw new Error("get_formulas (Statistical) failed");
  }

  // 3. Test describe_formula case-insensitive
  console.log("\n3. Testing 'describe_formula' with name 'vlookup'...");
  res = await server.executeTool("describe_formula", { name: "vlookup" });
  console.log("Response:\n", res.content[0].text);
  if (res.isError || !res.content[0].text.includes("VLOOKUP") || !res.content[0].text.includes("Lookup & Reference")) {
    throw new Error("describe_formula (vlookup) failed");
  }

  // 4. Test describe_formula error case
  console.log("\n4. Testing 'describe_formula' with invalid name 'NOT_A_FORMULA'...");
  res = await server.executeTool("describe_formula", { name: "NOT_A_FORMULA" });
  console.log("Response:", JSON.stringify(res));
  if (!res.isError || !res.content[0].text.includes("Formula function 'NOT_A_FORMULA' not found.")) {
    throw new Error("describe_formula error case failed");
  }

  console.log("\nSUCCESS: All new formula helper tools verified successfully!");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});

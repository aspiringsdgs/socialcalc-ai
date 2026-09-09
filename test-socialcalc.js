// Quick test to verify SocialCalc modularization
import SocialCalc from './socialcalc/core/index.js';
const AppGeneral = { SocialCalc };

console.log('Testing SocialCalc modularization...');

// Test if SocialCalc is available
if (AppGeneral.SocialCalc) {
    console.log('✅ SocialCalc object found');
    
    // Test some key components
    const tests = [
        { name: 'Constants', check: () => AppGeneral.SocialCalc.Constants },
        { name: 'Cell class', check: () => AppGeneral.SocialCalc.Cell },
        { name: 'Sheet class', check: () => AppGeneral.SocialCalc.Sheet },
        { name: 'ParseSheetSave', check: () => AppGeneral.SocialCalc.ParseSheetSave },
        { name: 'CreateSheetSave', check: () => AppGeneral.SocialCalc.CreateSheetSave },
    ];
    
    tests.forEach(test => {
        try {
            const result = test.check();
            if (result) {
                console.log(`✅ ${test.name} - Available`);
            } else {
                console.log(`❌ ${test.name} - Missing`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
        }
    });
    
    console.log('✅ Modularization test completed');
} else {
    console.log('❌ SocialCalc object not found');
}

// Test agent module loading in Node.js
try {
    const { enableAgent, getAgentContext, getAgentToolDefinitions } = await import('./socialcalc/modules/agent.js');
    if (typeof enableAgent === 'function' && typeof getAgentContext === 'function' && typeof getAgentToolDefinitions === 'function') {
        console.log('✅ Agent module (socialcalc/modules/agent.js) - Available in Node.js');
    } else {
        console.log('❌ Agent module - Missing functions');
    }
} catch (agentError) {
    console.log(`❌ Agent module error: ${agentError.message}`);
}

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

#!/usr/bin/env tsx

import { professorPaperList, categoryBreakdown } from './professor-paper-list';

console.log('📚 Professor\'s Paper Bank Summary');
console.log('=====================================\n');

console.log(`Total Papers: ${professorPaperList.length}\n`);

console.log('📊 Papers by Category:');
console.log('----------------------');
Object.entries(categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .forEach(([category, count]) => {
    const percentage = ((count / professorPaperList.length) * 100).toFixed(1);
    console.log(`  • ${category.padEnd(35)} ${count.toString().padStart(2)} papers (${percentage}%)`);
  });

console.log('\n🔍 Identifier Types:');
console.log('-------------------');
const identifierTypes = professorPaperList.reduce((acc, paper) => {
  acc[paper.identifierType] = (acc[paper.identifierType] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

Object.entries(identifierTypes).forEach(([type, count]) => {
  const percentage = ((count / professorPaperList.length) * 100).toFixed(1);
  console.log(`  • ${type.padEnd(10)} ${count.toString().padStart(2)} papers (${percentage}%)`);
});

console.log('\n📋 Sample Papers by Category:');
console.log('-----------------------------');

// Show 2 examples from each category
const categorySamples = professorPaperList.reduce((acc, paper) => {
  if (!acc[paper.category]) {
    acc[paper.category] = [];
  }
  if (acc[paper.category].length < 2) {
    acc[paper.category].push(paper);
  }
  return acc;
}, {} as Record<string, typeof professorPaperList>);

Object.entries(categorySamples)
  .sort(([,a], [,b]) => b.length - a.length)
  .forEach(([category, papers]) => {
    console.log(`\n${category}:`);
    papers.forEach((paper, index) => {
      const truncated = paper.identifier.length > 80 
        ? paper.identifier.substring(0, 77) + '...' 
        : paper.identifier;
      console.log(`  ${index + 1}. ${truncated}`);
    });
    if (categoryBreakdown[category] > 2) {
      console.log(`     ... and ${categoryBreakdown[category] - 2} more papers`);
    }
  });

console.log('\n✅ Paper list is ready for processing!');
console.log('Run: tsx src/scripts/run-paper-bank-builder.ts --dry-run');

/**
 * Runtime contracts are documented here with JSDoc so the dependency-free MVP
 * remains editor-friendly and can migrate to TypeScript without changing data shapes.
 *
 * @typedef {'survival'|'belonging'|'ego'|'rational'|'care'|'integration'|'transcendence'} ModeId
 * @typedef {{dominantMode:ModeId,secondaryMode:ModeId,fallbackMode:ModeId,dimensions:Record<string,number>,modeScores?:Record<string,number>}} AssessmentResult
 * @typedef {{id:string,label:string,start:number,end:number}} SceneDefinition
 * @typedef {{slug:string,title:string,mechanisms:string[],oldLoop:string[],interventions:string[],newLoop:string[],trainingPrompt:string,scenes:SceneDefinition[]}} LifeQuestionContent
 */
export const CONTRACT_VERSION = '0.1.0';

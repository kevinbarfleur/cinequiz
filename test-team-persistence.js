// Quick test to verify team persistence functionality
import { LocalStorageManager } from './src/utils/localStorage.js'

console.log('Testing team persistence...')

// Test team data
const teams = [
  { id: 'team-1', name: 'Test Team A', score: 5, color: '#ff6b6b' },
  { id: 'team-2', name: 'Test Team B', score: 3 }
]

// Save team data
const saveSuccess = LocalStorageManager.saveTeamData(teams)
console.log('Save teams success:', saveSuccess)

// Retrieve team data
const retrievedData = LocalStorageManager.getTeamData()
console.log('Retrieved teams:', retrievedData.teams)

// Test session
const sessionSuccess = LocalStorageManager.saveTeamSession(teams, [], 0, 'host')
console.log('Save session success:', sessionSuccess)

const hasSession = LocalStorageManager.hasInterruptedSession()
console.log('Has interrupted session:', hasSession)

console.log('Team persistence test completed!')
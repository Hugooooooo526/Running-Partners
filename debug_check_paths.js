// Quick script to check what path data exists in your database
// Run this with: cd frontend && npx ts-node ../debug_check_paths.ts

import { supabase } from './frontend/services/supabaseClient';

async function checkPathData() {
  console.log('Fetching run_invites data...\n');
  
  const { data, error } = await supabase
    .from('run_invites')
    .select('id, sender_id, receiver_id, path, distance_km, duration_minutes, ended_at, start_latitude, start_longitude, end_latitude, end_longitude')
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No completed runs found in the database.');
    return;
  }

  console.log(`Found ${data.length} completed run(s):\n`);

  data.forEach((run, index) => {
    console.log(`Run ${index + 1}:`);
    console.log(`  ID: ${run.id}`);
    console.log(`  Ended at: ${run.ended_at}`);
    console.log(`  Distance: ${run.distance_km} km`);
    console.log(`  Duration: ${run.duration_minutes} minutes`);
    console.log(`  Start: (${run.start_latitude}, ${run.start_longitude})`);
    console.log(`  End: (${run.end_latitude}, ${run.end_longitude})`);
    console.log(`  Path type: ${typeof run.path}`);
    console.log(`  Path is array: ${Array.isArray(run.path)}`);
    console.log(`  Path length: ${Array.isArray(run.path) ? run.path.length : 'N/A'}`);
    
    if (Array.isArray(run.path) && run.path.length > 0) {
      console.log(`  First point:`, run.path[0]);
      if (run.path.length > 1) {
        console.log(`  Second point:`, run.path[1]);
      }
      console.log(`  Last point:`, run.path[run.path.length - 1]);
    } else {
      console.log(`  ⚠️  Path is empty or invalid!`);
    }
    console.log('');
  });
}

checkPathData().catch(console.error);

// Field definitions for each sport and position

export const getFieldsForPosition = (
  sport: string,
  position: string
): string[] => {
  if (sport === 'basketball') {
    switch (position) {
      case 'Point Guard':
        return [
          'Year',
          'Wingspan',
          'Vertical Jump',
          'HUDL',
          'Standing Reach',
          'Max Vertical with Approach',
          '3/4 Court Sprint time',
          'Lane Agility Drill time',
          'Body fat %',
          'Jersey number',
          'Points per Game',
          'Assists Per Game',
          'Steals Per Game',
          'Turnovers per Game',
          'Free Throw %',
          '3-point %',
          'Field Goal %',
          'Minutes Played Per Game',
          '3/4 Court Sprint Time',
        ];
      case 'Shooting Guard':
        return [
          'Year',
          'Wingspan',
          'Vertical Jump',
          'HUDL',
          'Standing Reach',
          'Max Vertical with Approach',
          '3/4 Court Sprint time',
          'Lane Agility Drill time',
          'Body fat %',
          'Jersey number',
          'Points per Game',
          'Assists Per Game',
          'Steals Per Game',
          'Free Throw %',
          '3-point %',
          'Field Goal %',
          'Rebounds Per Game',
          'Spot-Up Shooting %',
        ];
      case 'Small Forward':
        return [
          'Year',
          'Wingspan',
          'Vertical Jump',
          'HUDL',
          'Standing Reach',
          'Max Vertical with Approach',
          '3/4 Court Sprint time',
          'Lane Agility Drill time',
          'Body fat %',
          'Jersey number',
          'Points per Game',
          'Assists Per Game',
          'Steals Per Game',
          'Free Throw %',
          '3-point %',
          'Field Goal %',
          'Rebounds Per Game',
          'Blocks Per Game',
          'Sprint Speed (3/4 Court time)',
        ];
      case 'Power Forward':
        return [
          'Year',
          'Wingspan',
          'Vertical Jump',
          'HUDL',
          'Standing Reach',
          'Max Vertical with Approach',
          '3/4 Court Sprint time',
          'Lane Agility Drill time',
          'Body fat %',
          'Jersey number',
          'Points per Game',
          'Assists Per Game',
          'Free Throw %',
          'Field Goal %',
          'Rebounds Per Game',
          'Blocks Per Game',
          'Post Move Efficiency',
          'Lane Agility Time',
        ];
      case 'Center':
        return [
          'Year',
          'Wingspan',
          'Vertical Jump',
          'HUDL',
          'Standing Reach',
          'Max Vertical with Approach',
          '3/4 Court Sprint time',
          'Lane Agility Drill time',
          'Body fat %',
          'Jersey number',
          'Points per Game',
          'Free Throw %',
          'Field Goal %',
          'Rebounds Per Game',
          'Blocks Per Game',
          'Post Move Efficiency',
          'Offensive Rebounds per Game',
          'Defensive Rebounds per Game',
          'Bench Press (reps @ 185lbs)',
        ];
      default:
        return [];
    }
  } else if (sport === 'football') {
    switch (position) {
      case 'Quarterback':
        return [
          'Year',
          'Passing Yards',
          'Passing Touchdowns',
          'Completion Percentage',
          'Interceptions Thrown',
          'Rushing Yards',
          'Rushing Touchdowns',
          'QBR (Quarterback Rating)',
          'Pass Attempts',
          'Pass Completions',
          'Longest Pass',
          'Sacks Taken',
          'Fumbles',
        ];
      case 'Running Back':
        return [
          'Year',
          'Rushing Yards',
          'Rushing Touchdowns',
          'Rushing Attempts',
          'Yards Per Carry',
          'Receptions',
          'Receiving Yards',
          'Receiving Touchdowns',
          'Fumbles',
          'Longest Run',
        ];
      case 'Wide Receiver':
        return [
          'Year',
          'Receptions',
          'Receiving Yards',
          'Receiving Touchdowns',
          'Yards Per Reception',
          'Targets',
          'Catch Percentage',
          'Longest Reception',
          'Fumbles',
        ];
      case 'Tight End':
        return [
          'Year',
          'Receptions',
          'Receiving Yards',
          'Receiving Touchdowns',
          'Yards Per Reception',
          'Targets',
          'Catch Percentage',
          'Blocking Grade',
          'Longest Reception',
        ];
      case 'Offensive Line':
        return [
          'Year',
          'Games Played',
          'Pancake Blocks',
          'Sacks Allowed',
          'Blocking Grade',
          'Penalties',
        ];
      case 'Defensive Line':
        return [
          'Year',
          'Tackles',
          'Sacks',
          'Tackles for Loss',
          'Forced Fumbles',
          'Fumble Recoveries',
          'Pass Deflections',
          'QB Hurries',
        ];
      case 'Linebacker':
        return [
          'Year',
          'Tackles',
          'Sacks',
          'Tackles for Loss',
          'Interceptions',
          'Pass Deflections',
          'Forced Fumbles',
          'Fumble Recoveries',
          'Defensive Touchdowns',
        ];
      case 'Cornerback':
        return [
          'Year',
          'Tackles',
          'Interceptions',
          'Pass Deflections',
          'Forced Fumbles',
          'Fumble Recoveries',
          'Defensive Touchdowns',
          'Completion Percentage Allowed',
        ];
      case 'Safety':
        return [
          'Year',
          'Tackles',
          'Interceptions',
          'Pass Deflections',
          'Forced Fumbles',
          'Fumble Recoveries',
          'Defensive Touchdowns',
          'Tackles for Loss',
        ];
      case 'Kicker':
        return [
          'Year',
          'Field Goals Made',
          'Field Goals Attempted',
          'Field Goal Percentage',
          'Longest Field Goal',
          'Extra Points Made',
          'Extra Points Attempted',
          'Touchbacks',
        ];
      case 'Punter':
        return [
          'Year',
          'Punts',
          'Punt Average',
          'Longest Punt',
          'Punts Inside 20',
          'Touchbacks',
        ];
      default:
        // Fallback for any other football positions
        return [
          'Year',
          'Games Played',
          'Tackles',
          'Sacks',
          'Interceptions',
        ];
    }
  } else if (sport === 'golf') {
    switch (position) {
      case 'General':
        return [
          'Year',
          'Graduation Year',
          'Average 18 hole Score',
          'Tournament Video',
          'USGA Lowest 18 hole tournament',
          'Handicap index',
          'Top finishes at major events',
          'Putting Average',
          'Number of Tournament wins',
          'Scoring Differential',
          'Scoring Average',
          'Lowest Round Score',
          'Driving Distance',
          'Driving Accuracy',
          'Greens in Regulation',
          'Puts per round',
          'Sand Save %',
          'Scrambling',
          'Fairways hit per round',
          'Fairways hit %',
          'Birdies per round',
          'Eagles per season',
          'Years playing golf',
          'Swing speed',
          'Club affliation',
          'Training Schedule',
          'Tournament wins',
          'Short game ratings',
          'High School team role',
          'Mental focus rating',
          'Putting Accuracy',
          'Practice hours per week',
          'Strength & Condition',
        ];
      default:
        return [];
    }
  }
  return [];
};

// Get position options based on sport
export const getPositionOptions = (sport: string): string[] => {
  if (sport === 'basketball') {
    return [
      'Point Guard',
      'Shooting Guard',
      'Small Forward',
      'Power Forward',
      'Center',
    ];
  } else if (sport === 'football') {
    return [
      'Quarterback',
      'Running Back',
      'Wide Receiver',
      'Tight End',
      'Offensive Line',
      'Defensive Line',
      'Linebacker',
      'Cornerback',
      'Safety',
      'Kicker',
      'Punter',
    ];
  } else if (sport === 'golf') {
    return ['General'];
  }
  return [];
};

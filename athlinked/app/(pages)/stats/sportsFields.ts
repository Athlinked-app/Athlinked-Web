// Field definitions for each sport and position

export const getFieldsForPosition = (sport: string, position: string): string[] => {
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
    // Football fields (existing)
    return [
      'Year',
      'Passing Yards',
      'Passing Touchdowns',
      'Completion Percentage',
      'Interceptions Thrown',
    ];
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
    return [
      'General',
    ];
  }
  return [];
};


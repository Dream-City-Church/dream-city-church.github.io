# 2025 Recap Widget

A personalized year-in-review widget for Dream City Church members that displays their church engagement statistics, highlights, and milestones from 2025.

## Image Placeholder
<!-- Add widget screenshot here -->

## Overview

The 2025 Recap widget creates an engaging, mobile-optimized summary of a user's church activities throughout the year. It presents personalized data including event attendance, volunteer hours, group participation, giving summary, prayer activity, and significant milestones in an attractive, social media-ready format.

## Features

- **Personalized Timeline** - Shows the user's first and most recent church activities
- **Activity Statistics** - Displays event attendance, volunteer hours, group participation
- **Campus Highlights** - Features the user's most visited campus with background imagery
- **Milestone Tracking** - Celebrates significant achievements and anniversaries
- **Giving Summary** - Shows generosity impact (for household heads)
- **Prayer & Community** - Tracks prayer requests, praises, and community support
- **Looking Forward** - Encourages continued engagement with action buttons
- **User Feedback** - Integrated feedback collection system

## Technical Stack

### Frontend
- **HTML5** with Liquid templating engine
- **CSS3** with custom properties and responsive design
- **JavaScript** with debug console functionality
- **Font Awesome** icons (Pro version)

### Dependencies
- Font Awesome Kit
- Feedback Fish
- Google Fonts

### Browser Support
- Modern browsers with CSS Grid and Custom Properties support
- Mobile-optimized with responsive breakpoints
- Dark mode support via `prefers-color-scheme`
- Reduced motion support for accessibility

## File Structure

```
2025recap/
├── README.md                 # Project documentation
├── recap.html               # Main widget page
├── recap-template.html      # Liquid template with data binding
└── recap.css               # Comprehensive widget styles
```

## Data Sources

The widget consumes data from multiple sources:
- **DataSet1** - User profile information
- **DataSet2** - Activity statistics and timeline
- **DataSet3** - Event participation data
- **DataSet4** - Group membership and leadership
- **DataSet5** - Volunteer service hours
- **DataSet6** - Milestone achievements
- **DataSet7** - Prayer and community engagement
- **DataSet8** - Giving summary (restricted to household heads)
- **DataSet9** - Special campaign participation
- **DataSet10** - Action links and CTAs

## Responsive Design

The widget is fully responsive with breakpoints at:
- Desktop: 920px max-width container
- Tablet: 768px and below
- Mobile: 480px and below

## Accessibility Features

- Semantic HTML structure with ARIA labels
- High contrast color ratios
- Reduced motion support for animations
- Keyboard navigation support
- Screen reader friendly content structure

## Debug Features

- Hidden debug console (activated by 5 taps on loading text)
- Real-time error logging and console capture
- Network request monitoring
- Performance timing display

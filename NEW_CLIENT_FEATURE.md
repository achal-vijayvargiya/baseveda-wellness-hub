# New Client Creation Feature

## Overview
A comprehensive multi-step form for creating new clients with complete health assessment including:
- Basic client information
- Health profile and lifestyle data
- Ayurvedic Dosha quiz (10 questions)
- Gut health assessment quiz (10 questions)

## Features

### 1. Multi-Step Form Interface
- **Step 1: Basic Info** - Personal details (name, email, phone, DOB, gender, address)
- **Step 2: Health Profile** - Health metrics and lifestyle information
- **Step 3: Dosha Quiz** - Ayurvedic constitution assessment
- **Step 4: Gut Health Quiz** - Digestive health evaluation

### 2. User Experience
- Visual progress indicator with step icons
- Form validation at each step
- Smooth navigation between steps
- Loading states and error handling
- Success toast notification on completion
- Automatic redirect to client details page

### 3. Data Collection

#### Basic Info (Step 1)
- First Name* (required)
- Last Name* (required)
- Email
- Phone
- Date of Birth
- Gender (Male/Female/Other)
- Address
- Medical History

#### Health Profile (Step 2)
- Age, Weight (kg), Height (cm)
- Health & Fitness Goals
- Activity Level (Sedentary to Extremely Active)
- Diet Type (Veg/Non-Veg/Vegan/Eggetarian)
- Current Diseases/Conditions
- Allergies
- Current Supplements
- Current Medications
- Sleep Cycle

#### Dosha Quiz (Step 3)
10 questions covering:
1. Body Frame & Build
2. Skin Type
3. Hair Type
4. Appetite & Digestion
5. Sleep Pattern
6. Personality & Temperament
7. Response to Stress
8. Climate Preference
9. Energy Levels
10. Mind & Focus

Each question has 3 options (A=Vata, B=Pitta, C=Kapha)

#### Gut Health Quiz (Step 4)
10 questions covering:
1. Appetite regularity
2. Post-meal digestion
3. Bowel movement frequency
4. Energy after meals
5. Food reaction tolerance
6. Tongue coating/breath
7. Sleep quality
8. Eating habits
9. Bloating patterns
10. Immunity strength

Each question has 3 options (A=Balanced, B=Weak, C=Overactive)

## Technical Implementation

### Files Created/Modified

#### New Files:
1. **`src/lib/api.ts`** - API client utilities
   - Client CRUD operations
   - Health profile management
   - Dosha quiz API
   - Gut health quiz API
   - Authentication helpers

2. **`src/pages/NewClient.tsx`** - Main component
   - Multi-step form logic
   - Form state management
   - Quiz rendering
   - API integration
   - Navigation flow

#### Modified Files:
1. **`src/App.tsx`** - Added `/new-client` route
2. **`src/pages/Dashboard.tsx`** - Added navigation to new client page

### API Endpoints Used

#### Client Management
- `POST /api/v1/clients/` - Create new client

#### Health Profile
- `POST /api/v1/health-profiles/` - Create health profile

#### Dosha Quiz
- `GET /api/v1/dosha-quiz/questions` - Get quiz questions
- `POST /api/v1/dosha-quiz/` - Submit quiz responses

#### Gut Health Quiz
- `GET /api/v1/gut-health-quiz/questions` - Get quiz questions
- `POST /api/v1/gut-health-quiz/` - Submit quiz responses

### Data Flow

1. User fills basic client information
2. User completes health profile (optional fields)
3. User answers all 10 Dosha quiz questions
4. User answers all 10 Gut Health quiz questions
5. On submit:
   - Create client record
   - Create health profile (if data provided)
   - Submit Dosha quiz (automatically calculates dosha)
   - Submit Gut Health quiz (automatically calculates state)
   - Navigate to client details page

### Backend Processing

The backend automatically:
- Validates all input data
- Calculates BMI from weight and height
- Calculates Dosha scores (Vata, Pitta, Kapha percentages)
- Determines dominant dosha(s)
- Calculates Gut Health scores (Balanced, Weak, Overactive)
- Determines gut health state
- Generates personalized recommendations

## Setup

### Prerequisites
- Backend API running on `http://localhost:8000`
- Authentication token stored in localStorage

### Environment Variables
Create `.env` file in `baseveda-wellness-hub/`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Usage

1. Navigate to Dashboard
2. Click "Add New Client" button
3. Fill in all required information across 4 steps
4. Click "Create Client" on final step
5. System will:
   - Create client
   - Save all health data
   - Calculate assessments
   - Redirect to client profile

## Form Validation

### Step 1 (Basic Info)
- First Name: Required
- Last Name: Required
- Email: Valid email format (if provided)
- Other fields: Optional

### Step 2 (Health Profile)
- All fields optional
- Age: 0-150 years
- Weight: Positive number
- Height: Positive number
- Activity level: Predefined options
- Diet type: Predefined options

### Step 3 (Dosha Quiz)
- All 10 questions required
- Must select A, B, or C for each

### Step 4 (Gut Health Quiz)
- All 10 questions required
- Must select A, B, or C for each

## Error Handling

- Network errors: Toast notification with retry option
- Validation errors: Inline error messages
- Backend errors: User-friendly error messages
- Loading states: Spinner indicators

## UI/UX Features

- **Progress Bar**: Visual indicator of completion
- **Step Icons**: Clear iconography for each section
- **Form State**: Persisted across navigation
- **Responsive**: Works on mobile and desktop
- **Accessibility**: Proper labels and ARIA attributes
- **Validation**: Real-time validation feedback
- **Toast Notifications**: Success/error feedback

## Future Enhancements

1. Save draft functionality
2. Edit quiz responses after submission
3. Print client intake form
4. Export data to PDF
5. Email client confirmation
6. Bulk client import
7. Custom quiz questions
8. Multi-language support

## Testing

### Manual Testing Checklist
- [ ] Navigate to Dashboard
- [ ] Click "Add New Client"
- [ ] Fill Step 1 (Basic Info) and click Next
- [ ] Fill Step 2 (Health Profile) and click Next
- [ ] Answer all Step 3 (Dosha Quiz) questions and click Next
- [ ] Answer all Step 4 (Gut Health Quiz) questions
- [ ] Click "Create Client"
- [ ] Verify success toast appears
- [ ] Verify redirect to client details page
- [ ] Verify all data saved correctly in backend

### Edge Cases to Test
- Leaving required fields empty
- Invalid email format
- Missing quiz answers
- Network errors during submission
- Navigating back and forth between steps
- Browser refresh during form completion

## Support

For issues or questions:
1. Check backend API is running
2. Verify authentication token is valid
3. Check browser console for errors
4. Review network tab for failed requests
5. Verify environment variables are set

## API Documentation

Refer to backend API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`


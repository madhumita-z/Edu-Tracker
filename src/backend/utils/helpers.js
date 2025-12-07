const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const calculateGPA = (grades) => {
    if (!grades || grades.length === 0) return '0.0';
    
    const gradePoints = {
        'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };
    
    let totalPoints = 0;
    grades.forEach(grade => {
        totalPoints += gradePoints[grade] || 0;
    });
    
    return (totalPoints / grades.length).toFixed(1);
};

const calculateGrade = (total) => {
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
};

const validateEmailDomain = (email) => {
    return email.endsWith('@clg.edu.in');
};

module.exports = {
    formatDate,
    calculateGPA,
    calculateGrade,
    validateEmailDomain
};
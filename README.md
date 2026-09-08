\# AttendAI



> AI-Powered Attendance Management System



AttendAI is a smart attendance management system designed to make classroom attendance more secure, accurate, and efficient.



The system combines QR-based attendance sessions, face verification, GPS verification, academic eligibility checks, and role-based dashboards for Students, Teachers, and Administrators.



\## Features



\### Student



\- Secure registration and login

\- Student profile management

\- Department, semester, section, and roll number management

\- View eligible active attendance sessions

\- QR-based attendance

\- Face verification

\- GPS-based location verification

\- Attendance history

\- Attendance summary

\- Notifications

\- Responsive dashboard



\### Teacher



\- Secure teacher login

\- Teacher profile management

\- Create attendance sessions

\- Configure attendance duration

\- Generate QR codes

\- Session countdown and automatic expiry

\- Classroom location and attendance radius

\- Department, semester, and section-based session eligibility

\- Attendance monitoring

\- Attendance history and reports

\- Notifications

\- Responsive dashboard



\### Admin



\- Secure admin login

\- Student management

\- Teacher management

\- Attendance overview

\- Dashboard statistics

\- Timetable management

\- Teacher account creation

\- Teacher credential email workflow



\## Attendance Verification



AttendAI uses multiple verification layers before attendance is recorded:



1\. Student authentication

2\. Valid attendance session

3\. QR/session verification

4\. Session expiry validation

5\. Department verification

6\. Semester verification

7\. Section verification

8\. GPS location verification

9\. Face verification

10\. Duplicate attendance prevention



If a required verification fails, attendance is not recorded.



\## System Architecture



```text

&#x20;                   AttendAI Web Application

&#x20;                             |

&#x20;            +----------------+----------------+

&#x20;            |                |                |

&#x20;            v                v                v

&#x20;       Student          Teacher            Admin

&#x20;       Dashboard        Dashboard          Dashboard

&#x20;            |                |                |

&#x20;            +----------------+----------------+

&#x20;                             |

&#x20;                             v

&#x20;                   Node.js + Express

&#x20;                        Backend

&#x20;                             |

&#x20;            +----------------+----------------+

&#x20;            |                |                |

&#x20;            v                v                v

&#x20;         MongoDB         AI Service         Email

&#x20;                        Flask / Python      Service

&#x20;                             |

&#x20;                             v

&#x20;                   DeepFace + ArcFace

&#x20;                   Face Recognition


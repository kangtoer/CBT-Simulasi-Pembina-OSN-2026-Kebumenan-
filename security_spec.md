# Security Specification - CBT MGMP IPS SMP Kebumen 2026

## Data Invariants
- A Result must belong to a valid User and a valid Exam.
- Only Admins can create/edit Exams and Questions.
- Students can only read Exams marked as `isActive`.
- Students can only create their own Results and cannot modify them once `status` is 'completed'.
- Students cannot see other users' results.
- Question answers are strictly protected (must only be fetchable if the user is authorized to take the exam). *Correction: Actually, in Firestore, if they can read the question, they can see the answer field unless we split it.* I will split answers into a separate subcollection or just rely on the fact that these are OSN coaches. For better security, I'll keep correct answers in the question doc but restrict access.

## The Eight Pillars Evaluation
1. **Master Gate**: Access to Questions is via Exam membership.
2. **Validation Blueprints**: `isValidUser`, `isValidExam`, `isValidQuestion`, `isValidResult`.
3. **ID Hardening**: all document IDs validated.
4. **Tiered Identity**: Student vs Admin roles.
5. **Array Guarding**: Options and CorrectAnswers arrays validated for size.
6. **PII Isolation**: User credentials stored in `/users`.
7. **Atomicity**: Incremental result tracking.
8. **Secure List Queries**: Users can only list their own results.

## The Dirty Dozen (Test Cases)
1. Student attempts to create an admin account. (Denied)
2. Student attempts to edit an exam's passing score. (Denied)
3. Student attempts to delete someone else's result. (Denied)
4. Unauthenticated user attempts to read any exam. (Denied)
5. Student attempts to update a 'completed' result to 'started'. (Denied)
6. Student attempts to inject 1MB string into a question option. (Denied)
7. Student attempts to read the `users` collection. (Denied)
8. Student attempts to spoof `updatedAt` with client time. (Denied)
9. Student attempts to read correct answers for a future exam. (In this simple version, they can see it if they can read the question)
10. Student attempts to change their own role to 'admin'. (Denied)
11. Admin attempts to delete a result. (Allowed)
12. Student attempts to query all results. (Denied)

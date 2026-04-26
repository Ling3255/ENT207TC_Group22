-- ============================================================
-- Cambridge Programmes Data Enrichment
-- Source: official Cambridge Postgraduate Study directory
-- Updated: 2025-04-25
-- ============================================================

-- 1. MPhil in Advanced Chemical Engineering
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    tuition_fee_overseas_gbp = 19674,
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egcempace',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK First class Honours Degree (or equivalent) in chemical engineering or closely related subject. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef1ae003jjgv528kdqiy4';

-- 2. MPhil in Advanced Computer Science
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '9 months full-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/cscsmpacs',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-02-10',
    application_deadline_non_visa = '2026-02-10',
    raw_requirement_text = 'Academic: UK First class Honours Degree (or equivalent) in computer science; alternatively engineering, science, mathematics or another numerate degree with significant relevant preparation. Mathematics to A-level and programming experience presumed. Language: IELTS 7.5 overall (all elements 7.0) or TOEFL 107 overall (all elements 25). No ATAS required. Applications considered as gathered field.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef1az003ljgv56o5kjw9p';

-- 3. MPhil in Biotechnology
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egcempbit',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK High II.i Honours Degree (or equivalent) in chemical engineering, biological science, engineering, chemistry, applied mathematics, physics or related subjects. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required. Selection process: rolling basis with interview.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef1ao003kjgv5xpr42f08';

-- 4. MPhil in Electrical and Electronic Engineering
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpeee',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering, natural sciences, computer science, mathematics or related subject. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef192003ejgv5qzdp9v8y';

-- 5. MPhil in Energy Technologies (already well-populated; minor updates)
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    tuition_fee_home_gbp = 16752,
    tuition_fee_overseas_gbp = 16752,
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpmet',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering or related science. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 100,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoe4fc3y0015gwv5yni3kp11';

-- 6. MPhil in Engineering (research)
UPDATE programmes SET
    study_mode = 'research',
    duration_text = '12 months full-time; 24 months part-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpmeg',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering, natural sciences, computer science, mathematics or related subject. Most successful applicants have an engineering or science background. Applicants MUST name at least one supervisor and provide a research interest statement. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoe4fc35000ygwv5f2lulvms';

-- 7. MPhil in Engineering for Sustainable Development (fix deadline)
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    tuition_fee_home_gbp = 16752,
    tuition_fee_overseas_gbp = 16752,
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpesd',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-03-26',
    application_deadline_non_visa = '2026-03-26',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering or related discipline. Employment history and personal statement required. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 100,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoe4fc3j0012gwv5kze9uxsj';

-- 8. MPhil in Industrial Systems, Manufacture, and Management (already well-populated)
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    tuition_fee_home_gbp = 21174,
    tuition_fee_overseas_gbp = 21174,
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpimm',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering, manufacturing, business or related subject. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 100,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoe4fc4e0019gwv5tr2z5wk6';

-- 9. MPhil in Machine Learning and Machine Intelligence
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    tuition_fee_overseas_gbp = 19674,
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpmsl',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-02-10',
    application_deadline_non_visa = '2026-02-10',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering, computer science, mathematics or related numerate subject. Five pathways available; applicants choose one at application. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required. Applications assessed as gathered field.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef19c003fjgv5hzass9rp';

-- 10. MPhil in Nuclear Energy
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '11 months full-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpmne',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering or related science subject (physics, chemistry, materials science). Some post-degree experience beneficial but not required. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required. Ten modules (10 credits) including 5 compulsory, research project required.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef19l003gjgv52xczixpu';

-- 11. MRes in Connected Electronic and Photonic Systems
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '12 months full-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmrpho',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in electrical engineering, electronic engineering, physics or related subject. One-year course combining taught modules at Cambridge and UCL with two research project reports. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 95,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef19v003hjgv5esqn4y2l';

-- 12. MSt in Construction Engineering
UPDATE programmes SET
    study_mode = 'taught',
    duration_text = '2 years part-time',
    intake_term = 'October 2026',
    official_url = 'https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmstce',
    application_open_date = '2025-09-03',
    application_deadline_visa = '2026-05-14',
    application_deadline_non_visa = '2026-05-14',
    raw_requirement_text = 'Academic: UK Good II.i Honours Degree (or equivalent) in engineering, construction, architecture or related discipline. Professional experience in construction sector highly valued. Part-time MSt offered by Department of Engineering through Laing O Rourke Centre for Construction Engineering and Technology. Language: IELTS 7.0 overall (L 7.0, W 7.0, R 6.5, S 7.0) or TOEFL 100 overall (all elements 25). ATAS required.',
    confidence_score = 90,
    source_last_checked_at = NOW(),
    updated_at = NOW()
WHERE id = 'cmoeef1a5003ijgv53nt69c22';

# Chatbot Knowledge Inventory — Sahaayak

This document outlines the structured knowledge blocks available to the chatbot for the scholarship-preparation service. All items are traced to existing seed metadata in the project. Unverified fields are labeled for owner review.

---

## 1. Candidate Knowledge Items

### Item 1: Service Overview
- **id**: `scholarship-overview`
- **serviceId**: `scholarship-preparation`
- **topic**: `guidelines`
- **title**: `Scholarship Preparation Overview`
- **plainLanguageAnswer**: `The Scholarship Preparation module helps you organize and confirm the identity records, application details, and physician certifications required for Accessible Parking Permit scholarships.`
- **sourceTitle**: `ACTIVE_SERVICE Metadata`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Sourced from the active service metadata inside `dbService.ts`.

### Item 2: Legal Name Field Clarification
- **id**: `field-name-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `questions`
- **title**: `Why is my legal name required?`
- **plainLanguageAnswer**: `You must enter your full legal name exactly as it appears on your government identification card. This is used to verify candidate identity profiles.`
- **sourceTitle**: `Legal Name Question Description`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Sourced from the `name` question definition inside `ACTIVE_SERVICE`.

### Item 3: Age Requirement & Date of Birth
- **id**: `field-dob-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `questions`
- **title**: `Are there age restrictions for this scholarship?`
- **plainLanguageAnswer**: `Yes. You must enter your date of birth, and you must be at least 18 years old to apply.`
- **sourceTitle**: `Date of Birth Question Description`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Sourced from the `dob` question details inside `ACTIVE_SERVICE`.

### Item 4: Medical Mobility limitation
- **id**: `field-impairment-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `questions`
- **title**: `What is a qualified medical mobility limitation?`
- **plainLanguageAnswer**: `A qualified mobility limitation is a physical condition diagnosed by a certified physician that severely limits your ability to walk (e.g. requiring wheelchair or oxygen assistance).`
- **sourceTitle**: `Mobility Impairment Question Description`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Sourced from `has_impairment` metadata inside `ACTIVE_SERVICE`.

### Item 5: Physician Information
- **id**: `field-doctor-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `questions`
- **title**: `Certifying Physician Details`
- **plainLanguageAnswer**: `You must enter your doctor's full legal name and their official 6-10 character medical license registration key. This registration will be verified with the state board.`
- **sourceTitle**: `Physician Details Question Description`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Aggregated from `doctor_name` and `doctor_license` definitions.

### Item 6: Identity Proof Checklist Document
- **id**: `doc-identity-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `documents`
- **title**: `What documents prove my identity?`
- **plainLanguageAnswer**: `You must upload or have ready a clear photo of your Government Driver License, Passport, or State Identification Card.`
- **sourceTitle**: `Identity Proof Document Description`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Sourced from `identity_proof` document checklist requirements.

### Item 7: Medical Certification Checklist Document
- **id**: `doc-medcert-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `documents`
- **title**: `What is the Medical Certification Form?`
- **plainLanguageAnswer**: `This is the physical Accessible Parking application form that has been completely filled out and signed by your physician within the last 6 months.`
- **sourceTitle**: `Medical Certificate Document Description`
- **sourceUrl**: 
- **sourceStatus**: `approved`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Sourced from `medical_certificate` checklist details.

### Item 8: Official Processing Fee Details
- **id**: `service-fees-help`
- **serviceId**: `scholarship-preparation`
- **topic**: `finance`
- **title**: `Is there a processing fee?`
- **plainLanguageAnswer**: `Information regarding fee structures or scholarship waivers is not available yet.`
- **sourceTitle**: 
- **sourceUrl**: 
- **sourceStatus**: `needs_owner_review`
- **language**: `en`
- **lastReviewedAt**: 
- **notes**: Missing source. Must be provided by project owner.

---

## 2. Required Owner Inputs Before Seeding

The following parameters must be formally reviewed and approved by the project owner before populating the Firestore chatbot configuration collections:

1. **Scholarship Name & Jurisdiction**: Exact name and country/state governing rules.
2. **Official Service URL**: Authoritative service manual/guidelines URLs.
3. **Approved Eligibility Guidance**: Clear eligibility policy guidelines.
4. **Approved Document Requirements**: Verified list of required files.
5. **Official Deadline Information**: Authoritative timeline parameters.
6. **Support Contact Channels**: Dedicated support email and phone parameters.

CREATE TYPE "public"."qualification_category" AS ENUM('Standard', 'Medical', 'Advanced', 'Aviation', 'Detachments', 'Leadership');--> statement-breakpoint
ALTER TABLE "qualifications" ADD COLUMN "category" "qualification_category" DEFAULT 'Standard' NOT NULL;
--> statement-breakpoint
-- Remove stale qualifications (clear all FK references first, no cascades defined)
DELETE FROM trooper_qualifications WHERE qualification_id IN (
    '203d1d94-790e-45c4-885e-be1e9fa600d2',
    '4458454d-6011-4c68-bb8d-f55e66156317'
);
DELETE FROM trainings WHERE qualification_id IN (
    '203d1d94-790e-45c4-885e-be1e9fa600d2',
    '4458454d-6011-4c68-bb8d-f55e66156317'
);
DELETE FROM qualifications WHERE id IN (
    '203d1d94-790e-45c4-885e-be1e9fa600d2',
    '4458454d-6011-4c68-bb8d-f55e66156317'
);
-- Standard
UPDATE qualifications SET category = 'Standard' WHERE id IN (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0852',
    'd290f1ee-6c54-4b01-90e6-d701748f0853',
    'd290f1ee-6c54-4b01-90e6-d701748f0854',
    'd290f1ee-6c54-4b01-90e6-d701748f0856',
    'd290f1ee-6c54-4b01-90e6-d701748f0857',
    '803794eb-53a6-4a37-9fc1-92d6602fa268'
);
-- Medical
UPDATE qualifications SET category = 'Medical' WHERE id IN (
    'd290f1ee-6c54-4b01-90e6-d701748f0855',
    'd290f1ee-6c54-4b01-90e6-d701748f0860'
);
-- Advanced
UPDATE qualifications SET category = 'Advanced' WHERE id IN (
    'd290f1ee-6c54-4b01-90e6-d701748f0859',
    '57621c6c-6b7c-450e-810e-aa252de5fb75',
    '3493bb4a-3d18-463d-8402-c6cb15cf6193',
    '8ab176c4-8c8f-44fa-91d5-76c2c3b9f8b2'
);
-- Aviation
UPDATE qualifications SET category = 'Aviation' WHERE id IN (
    'd290f1ee-6c54-4b01-90e6-d701748f0865',
    'd290f1ee-6c54-4b01-90e6-d701748f0870',
    'd290f1ee-6c54-4b01-90e6-d701748f0866'
);
-- Detachments
UPDATE qualifications SET category = 'Detachments' WHERE id IN (
    'd290f1ee-6c54-4b01-90e6-d701748f0858',
    'd290f1ee-6c54-4b01-90e6-d701748f0867',
    'd290f1ee-6c54-4b01-90e6-d701748f0868',
    'd290f1ee-6c54-4b01-90e6-d701748f0869'
);
-- Leadership
UPDATE qualifications SET category = 'Leadership' WHERE id IN (
    'd290f1ee-6c54-4b01-90e6-d701748f0861',
    'd290f1ee-6c54-4b01-90e6-d701748f0862',
    'd290f1ee-6c54-4b01-90e6-d701748f0863',
    'd290f1ee-6c54-4b01-90e6-d701748f0864'
);
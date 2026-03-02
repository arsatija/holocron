-- Add cadence enum
CREATE TYPE "series_cadence" AS ENUM ('Daily', 'Weekly', 'Biweekly', 'Monthly');

-- Add cadence column (existing series default to Weekly)
ALTER TABLE "event_series" ADD COLUMN "cadence" "series_cadence" NOT NULL DEFAULT 'Weekly';

-- Add start_date anchor column
ALTER TABLE "event_series" ADD COLUMN "start_date" date;

-- Add event_kind column (existing series were all Operations)
ALTER TABLE "event_series" ADD COLUMN "event_kind" "eventKind" NOT NULL DEFAULT 'Operation';

-- Make operation_type nullable (non-operation series don't need it)
ALTER TABLE "event_series" ALTER COLUMN "operation_type" DROP NOT NULL;
ALTER TABLE "event_series" ALTER COLUMN "operation_type" DROP DEFAULT;

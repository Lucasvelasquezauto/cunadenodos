-- AlterTable
-- experienceYears y school son nuevos campos requeridos, pero ya existen filas
-- de seed en TalentProfile — se agregan con un DEFAULT temporal para no
-- romper esas filas, y luego se quita el default para que quede igual de
-- requerido que headline/experienceAreas/linkedinUrl a nivel de columna.
ALTER TABLE "TalentProfile" ADD COLUMN     "experienceYears" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TalentProfile" ALTER COLUMN "experienceYears" DROP DEFAULT;

ALTER TABLE "TalentProfile" ADD COLUMN     "school" TEXT NOT NULL DEFAULT 'Otra';
ALTER TABLE "TalentProfile" ALTER COLUMN "school" DROP DEFAULT;

ALTER TABLE "TalentProfile" ADD COLUMN     "cvFileName" TEXT,
ADD COLUMN     "cvMimeType" TEXT,
ADD COLUMN     "cvFile" BYTEA,
ADD COLUMN     "cvUploadedAt" TIMESTAMP(3);

UPDATE `cars`
SET `gallery` = CASE 
    WHEN `image` IS NOT NULL THEN json_insert(coalesce(`gallery`, '[]'), '$[0]', json_object('image', `image`, 'alt', coalesce(`image_alt`, '')))
    ELSE coalesce(`gallery`, '[]')
END;
--> statement-breakpoint
ALTER TABLE `cars` DROP COLUMN `image`;--> statement-breakpoint
ALTER TABLE `cars` DROP COLUMN `image_alt`;
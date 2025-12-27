DROP TRIGGER IF EXISTS after_user_insert;--> statement-breakpoint
CREATE TRIGGER after_user_insert
AFTER INSERT ON SBI_USER
FOR EACH ROW
BEGIN
    INSERT INTO tracked_changes (operation, user_id, changed_at, processed, `role`)
    VALUES ('insert', NEW.USER_ID, NOW(), false, (
        SELECT
            r.NAME
        FROM
            SBI_EXT_USER_ROLES s
        INNER JOIN SBI_EXT_ROLES r ON r.EXT_ROLE_ID = s.EXT_ROLE_ID
        WHERE s.ID = NEW.ID
        LIMIT 1
    ));
END;
DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc ON "csc"."data";--> statement-breakpoint
CREATE TRIGGER
    "change_delta_logger_trigger_csc"
    BEFORE UPDATE OR DELETE OR INSERT
    ON "csc"."data"
    FOR EACH ROW
EXECUTE FUNCTION "revisions"."func_log_delta_changes"();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_personnel ON "csc"."data_personnel";--> statement-breakpoint
CREATE TRIGGER
    "change_delta_logger_trigger_csc_personnel"
    BEFORE INSERT OR UPDATE
    ON "csc"."data_personnel"
    FOR EACH ROW
EXECUTE FUNCTION "revisions"."func_log_delta_changes"();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_stats ON csc.data_statistiques;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_stats
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_statistiques
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_villages ON csc.data_villages;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_villages
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_villages
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_pieces ON csc.data_pieces;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_pieces
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_pieces
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_fosa ON fosa.data;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_fosa
    BEFORE UPDATE OR DELETE OR INSERT
    ON fosa.data
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_fosa_personnel ON fosa.data_personnel;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_fosa_personnel
    BEFORE UPDATE OR DELETE OR INSERT
    ON fosa.data_personnel
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_chefferie ON chefferie.data;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_chefferie
    BEFORE UPDATE OR DELETE OR INSERT
    ON chefferie.data
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_chefferie_personnel ON chefferie.data_personnel;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_chefferie_personnel
    BEFORE UPDATE OR DELETE OR INSERT
    ON chefferie.data_personnel
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_stats ON csc.data_statistiques;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_stats
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_statistiques
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_pieces ON csc.data_pieces;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_pieces
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_pieces
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_fosa ON fosa.data;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_fosa
    BEFORE UPDATE OR DELETE OR INSERT
    ON fosa.data
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_fosa_personnel ON fosa.data_personnel;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_fosa_personnel
    BEFORE UPDATE OR DELETE OR INSERT
    ON fosa.data_personnel
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_chefferie ON chefferie.data;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_chefferie
    BEFORE UPDATE OR DELETE OR INSERT
    ON chefferie.data
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_chefferie_personnel ON chefferie.data_personnel;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_chefferie_personnel
    BEFORE UPDATE OR DELETE OR INSERT
    ON chefferie.data_personnel
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint


DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_data_villages ON csc.data_statistiques;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_data_villages
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_villages
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint

DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_data_personnel ON csc.data_statistiques;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_data_personnel
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data_personnel
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint


DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_data ON csc.data_statistiques;--> statement-breakpoint
CREATE TRIGGER change_delta_logger_trigger_csc_data
    BEFORE UPDATE OR DELETE OR INSERT
    ON csc.data
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_log_delta_changes();--> statement-breakpoint


DROP TRIGGER IF EXISTS change_delta_logger_trigger_csc_archives ON "csc"."data_archives";--> statement-breakpoint
CREATE TRIGGER
    "change_delta_logger_trigger_csc_archives"
    BEFORE INSERT OR UPDATE OR DELETE
    ON "csc"."data_archives"
    FOR EACH ROW
EXECUTE FUNCTION "revisions"."func_log_delta_changes"();--> statement-breakpoint

DROP TRIGGER IF EXISTS remove_ledger_entry ON revisions.deltas;--> statement-breakpoint
CREATE TRIGGER remove_ledger_entry
    AFTER DELETE
    ON revisions.deltas
    FOR EACH ROW
EXECUTE FUNCTION revisions.func_update_ledger();

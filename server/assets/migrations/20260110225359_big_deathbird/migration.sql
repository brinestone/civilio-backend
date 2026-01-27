create function jsonb_to_hstore(data jsonb) returns hstore
    language plpgsql
as
$$
DECLARE
    _result HSTORE := ''::HSTORE;
    _kv     RECORD;
BEGIN
    FOR _kv IN SELECT key, value FROM jsonb_each_text(data)
        LOOP
            _result := _result || hstore(_kv.key, _kv.value);
        end loop;
    RETURN _result;
end;
$$;
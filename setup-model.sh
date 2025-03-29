export models="models.txt";
export commands="commands.txt";
export relationships="$commands";
export connectorName=$1;

for line in $(cat "$models"); do
    ddn model add $connectorName "$(echo -n "$line" | sed -e 's/[[:space:]]*$//')"
done

for line in $(cat "$commands"); do
    ddn command add $connectorName "$(echo -n "$line" | sed -e 's/[[:space:]]*$//')"
done

for line in $(cat "$relationships"); do
    ddn relationship add $connectorName "$(echo -n "$line" | sed -e 's/[[:space:]]*$//')"
done
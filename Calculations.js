

function getTypeStats(type_stats) {
    let unique = [...new Set(objects_list.map(object => object.type))];
    var total_area = 0;

    for (var i in unique)
        type_stats.push({ type: unique[i], number: 0, area: 0, percentage: 0 });

    for (var i in objects_list) {
        for (var j in type_stats) {
            if (objects_list[i].type == type_stats[j].type) {
                type_stats[j].number++;
                type_stats[j].area += objects_list[i].area;
                total_area += objects_list[i].area;
                break;
            }
        }
    }

    for (var i in type_stats) {
        type_stats[i].percentage = (type_stats[i].area * 100) / total_area;
        log.info(type_stats);
    }
}


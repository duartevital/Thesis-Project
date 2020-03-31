const pip = require('@turf/boolean-point-in-polygon');
const turf = require('@turf/helpers');
const line_intersect = require('@turf/line-intersect');
const ptld = require('@turf/point-to-line-distance');


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
    }
}

function polygonAllInsideViewport(map) {
    var bounds = map.getBounds();
    var ne_bounds = bounds._ne;
    var sw_bounds = bounds._sw;

    for (var i in objects_list) {
        var coords = objects_list[i].coords[0];
        var is_inside = false;

        for (var j = 0; j < coords.length; j++) {
            if (coords[j][0] < sw_bounds.lng || coords[j][0] > ne_bounds.lng || coords[j][1] < sw_bounds.lat || coords[j][1] > ne_bounds.lat) {
                //calcular area da por��o visivel
            }
        }
    }
}

function isPolyClockwise(coords) {
    var edge = 0;
    for (var i = 0; i < coords.length-1; i++) {
        var p1 = coords[i];
        var p2 = coords[i + 1];

        log.info("count 1 = " + Math.abs(p1[0] - p2[0]));
        log.info("count 2 = " + (p1[1] + p2[1]));

        var res = (p2[0] - p1[0]) * (p2[1] + p1[1]);
        log.info("res = " + res);
        edge += res;
        log.info("edge at " + i + " = " + edge);
    }
    log.info("edge = " + edge);

    if (edge < 0)
        return false;
    else
        return true;
}

function getVisiblePolygonPortion_v3(coords) {
    var new_coords = [];
    var bounds = map.getBounds();
    var ne_lng = bounds._ne.lng;
    var ne_lat = bounds._ne.lat;
    var sw_lng = bounds._sw.lng;
    var sw_lat = bounds._sw.lat;
    var viewport_poly = turf.polygon([[[sw_lng, ne_lat], [sw_lng, sw_lat], [ne_lng, sw_lat], [ne_lng, ne_lat], [sw_lng, ne_lat]]]);
    var nw_ne = { id: "nw_ne", line: turf.lineString([[sw_lng, ne_lat], [ne_lng, ne_lat]]) };
    var ne_se = { id: "ne_sw", line: turf.lineString([[ne_lng, ne_lat], [ne_lng, sw_lat]]) };
    var se_sw = { id: "se_sw", line: turf.lineString([[ne_lng, sw_lat], [sw_lng, sw_lat]]) };
    var sw_nw = { id: "sw_nw", line: turf.lineString([[sw_lng, sw_lat], [sw_lng, ne_lat]]) };
    var axis_lines = [nw_ne, ne_se, se_sw, sw_nw];
    var coords_poly = turf.polygon([coords]);

    var axis = {};
    for (var i = 0; i < coords.length - 1; i++) {
        var point = turf.point([coords[i][0], coords[i][1]]);
        if (pip.default(point, viewport_poly)) {
            new_coords.push(coords[i]);
        } else {
            var tmp_axis = getClosestAxis(point, axis_lines);
            if (axis.id != tmp_axis.id) {
                axis = tmp_axis;
                if (axis.id == "nw_ne") {
                    var found_points = lookInAxis(axis, coords_poly, true);
                    new_coords.push.apply(new_coords, found_points);
                } else if (axis.id == "ne_sw") {
                    var found_points = lookInAxis(axis, coords_poly, true);
                    new_coords.push.apply(new_coords, found_points);
                } else if (axis.id == "se_sw") {
                    var found_points = lookInAxis(axis, coords_poly, false);
                    new_coords.push.apply(new_coords, found_points);
                } else if (axis.id == "sw_nw") {
                    var found_points = lookInAxis(axis, coords_poly, true);
                    new_coords.push.apply(new_coords, found_points);
                }

            }
        }
    }

    new_coords.push(new_coords[0]);
    var new_poly = turf.polygon([new_coords]);
    return new_poly;
}

function lookInAxis(axis, poly, inverted) {
    var intersect = line_intersect.default(axis.line, poly);
    var axis_vertex_1 = axis.line.geometry.coordinates[0];
    var axis_vertex_2 = axis.line.geometry.coordinates[1];
    var result = [];

    if (pip.default(axis_vertex_1, poly) && pip.default(axis_vertex_2, poly)) {
        result.push(axis_vertex_1); result.push(axis_vertex_2);
        return result;
    }
    if (pip.default(axis_vertex_1, poly) && !pip.default(axis_vertex_2, poly)) {
        result.push(axis_vertex_1);
        for (var i = 0; i < intersect.features.length; i++) {
            result.push(intersect.features[i].geometry.coordinates);
        }
    }
    if (!pip.default(axis_vertex_1, poly) && pip.default(axis_vertex_2, poly)) {
        for (var i = 0; i < intersect.features.length; i++) {
            result.push(intersect.features[i].geometry.coordinates);
        }
        result.push(axis_vertex_2);
    }
    if (!pip.default(axis_vertex_1, poly) && !pip.default(axis_vertex_2, poly)) {
        for (var i = 0; i < intersect.features.length; i++) {
            result.push(intersect.features[i].geometry.coordinates);
        }
        if (inverted) {
            var tmp = [];
            tmp.push(result[result.length - 1]);
            tmp.push(result[0]);
            return tmp;
        } else {
            return result;
        }
    }

    return result;
}

function getClosestAxis(point, axes) {
    var closest_axis = {};
    var closest_distance = 100000000;
    for (var i = 0; i < axes.length; i++) {
        var current_axis_distance = ptld.default(point, axes[i].line);
        if (current_axis_distance < closest_distance) {
            closest_distance = current_axis_distance;
            closest_axis = axes[i];
        }
    }

    return closest_axis;
}


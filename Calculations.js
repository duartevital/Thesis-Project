const pol = require('@turf/boolean-point-on-line');
const turf = require('@turf/helpers');
const line_intersect = require('@turf/line-intersect');
const ptld = require('@turf/point-to-line-distance');
const line_length = require('@turf/length');


function getTypeStats(source_stats, type_stats) {
    let unique = Array.from(new Set(objects_list.map(a => a.type)))
        .map(type => {
            return objects_list.find(a => a.type === type);
        });

    var total_area = 0;
    for (var i in unique)
        type_stats.push({ source: unique[i].source, type: unique[i].type, number: 0, area: 0, percentage: 0 });

    for (var i in objects_list) {
        for (var j in type_stats) {
            if (objects_list[i].type == type_stats[j].type) {
                type_stats[j].number++;
                type_stats[j].area += objects_list[i].area;
                if (objects_list[i].source == "building")
                    source_stats.building_area += objects_list[i].area;
                else if (objects_list[i].source == "landuse")
                    source_stats.landuse_area += objects_list[i].area;

                total_area += objects_list[i].area;
                break;
            }
        }
    }

    for (var i in type_stats) {
        var percentage = (type_stats[i].area * 100) / total_area
        type_stats[i].percentage = Math.round(percentage * 100) / 100;;
    }
}

function getVisiblePolygonPortion(coords, isPolygon) {
    var new_coords = [];
    var bounds = map.getBounds();
    var ne_lng = bounds._ne.lng;
    var ne_lat = bounds._ne.lat;
    var sw_lng = bounds._sw.lng;
    var sw_lat = bounds._sw.lat;
    var viewport_poly = turf.polygon([[[sw_lng, ne_lat], [sw_lng, sw_lat], [ne_lng, sw_lat], [ne_lng, ne_lat], [sw_lng, ne_lat]]]);
    var nw_ne = { id: "nw_ne", line: turf.lineString([[sw_lng, ne_lat], [ne_lng, ne_lat]]), searched: false };
    var ne_se = { id: "ne_se", line: turf.lineString([[ne_lng, ne_lat], [ne_lng, sw_lat]]), searched: false };
    var se_sw = { id: "se_sw", line: turf.lineString([[ne_lng, sw_lat], [sw_lng, sw_lat]]), searched: false };
    var sw_nw = { id: "sw_nw", line: turf.lineString([[sw_lng, sw_lat], [sw_lng, ne_lat]]), seacrhed: false };
    var axis_lines = [nw_ne, ne_se, se_sw, sw_nw];
    if (isPolygon) {
        var coords_poly = turf.polygon(coords);
        var axis = {};
        for (var i = 0; i < coords[0].length - 1; i++) {
            var point = turf.point([coords[0][i][0], coords[0][i][1]]);
            if (pip.default(point, viewport_poly)) {
                new_coords.push(coords[0][i]);
            } else {
                var tmp_axis = getClosestAxis(point, axis_lines);
                if (axis.id != tmp_axis.id) {
                    axis = tmp_axis;
                    if (axis.id == "nw_ne") {
                        var found_points = lookInAxis(axis, coords_poly, true);
                        if (found_points.length > 0) {
                            new_coords.push.apply(new_coords, found_points);
                        }
                    } else if (axis.id == "ne_se") {
                        var found_points = lookInAxis(axis, coords_poly, true);
                        if (found_points.length > 0) {
                            new_coords.push.apply(new_coords, found_points);
                        }
                    } else if (axis.id == "se_sw") {
                        var found_points = lookInAxis(axis, coords_poly, false);
                        if (found_points.length > 0) {
                            new_coords.push.apply(new_coords, found_points);
                        }
                    } else if (axis.id == "sw_nw") {
                        var found_points = lookInAxis(axis, coords_poly, true);
                        if (found_points.length > 0) {
                            new_coords.push.apply(new_coords, found_points);
                        }
                    }
                }
            }
        }
    } else {
        for (var j in coords) {
            var coords_poly = turf.polygon(coords[j]);
            var axis = {};
            for (var i = 0; i < coords[j][0].length; i++) {
                var point = turf.point([coords[j][0][i][0], coords[j][0][i][1]]);
                if (pip.default(point, viewport_poly)) {
                    new_coords.push(coords[j][0][i]);
                } else {
                    var tmp_axis = getClosestAxis(point, axis_lines);
                    if (axis.id != tmp_axis.id) {
                        axis = tmp_axis;
                        if (axis.id == "nw_ne") {
                            var found_points = lookInAxis(axis, coords_poly, true);
                            if (found_points.length > 0)
                                new_coords.push.apply(new_coords, found_points);
                        } else if (axis.id == "ne_se") {
                            var found_points = lookInAxis(axis, coords_poly, true);
                            if (found_points.length > 0)
                                new_coords.push.apply(new_coords, found_points);
                        } else if (axis.id == "se_sw") {
                            var found_points = lookInAxis(axis, coords_poly, false);
                            if (found_points.length > 0)
                                new_coords.push.apply(new_coords, found_points);
                        } else if (axis.id == "sw_nw") {
                            var found_points = lookInAxis(axis, coords_poly, true);
                            if (found_points.length > 0)
                                new_coords.push.apply(new_coords, found_points);
                        }
                    }
                }
            }
        }
    }
    new_coords.push(new_coords[0]);
    var new_poly = turf.polygon([new_coords]);
    return new_poly;
}

function getVisibleRoadPortion(coords, isLineString) {
    var bounds = map.getBounds();
    var ne_lng = bounds._ne.lng;
    var ne_lat = bounds._ne.lat;
    var sw_lng = bounds._sw.lng;
    var sw_lat = bounds._sw.lat;
    var viewport_poly = turf.polygon([[[sw_lng, ne_lat], [sw_lng, sw_lat], [ne_lng, sw_lat], [ne_lng, ne_lat], [sw_lng, ne_lat]]]);
    var visible_len = 0;
    if (isLineString) {
        for (var i = 0; i < coords.length - 1; i++) {
            var current = [coords[i][0], coords[i][1]];
            var next = [coords[i + 1][0], coords[i + 1][1]];
            var tmp_line = turf.lineString([current, next]);

            if (pip.default(current, viewport_poly) && pip.default(next, viewport_poly)) {
                visible_len += line_length.default(tmp_line);
            } else {
                var intersection = line_intersect.default(tmp_line, viewport_poly);
                if (intersection.features.length == 1) {
                    var tmp_point = intersection.features[0].geometry.coordinates;
                    if (pip.default(current, viewport_poly)) {
                        tmp_line = turf.lineString([tmp_point, current]);
                    } else if (pip.default(next, viewport_poly)) {
                        tmp_line = turf.lineString([tmp_point, next]);
                    }
                    visible_len += line_length.default(tmp_line);
                } else if (intersection.features.length == 2) {
                    tmp_line = turf.lineString([intersection.features[0].geometry.coordinates, intersection.features[1].geometry.coordinates]);
                    visible_len += line_length.default(tmp_line);
                }
            }
        }
    } else {
        for (var j = 0; j < coords.length; j++) {
            for (var i = 0; i < coords[j].length - 1; i++) {
                var current = [coords[j][i][0], coords[j][i][1]];
                var next = [coords[j][i + 1][0], coords[j][i + 1][1]];
                var tmp_line = turf.lineString([current, next]);

                if (pip.default(current, viewport_poly) && pip.default(next, viewport_poly)) {
                    visible_len += line_length.default(tmp_line);
                } else {
                    var intersection = line_intersect.default(tmp_line, viewport_poly);
                    if (intersection.features.length == 1) {
                        var tmp_point = intersection.features[0].geometry.coordinates;
                        if (pip.default(current, viewport_poly)) {
                            tmp_line = turf.lineString([tmp_point, current]);
                        } else if (pip.default(next, viewport_poly)) {
                            tmp_line = turf.lineString([tmp_point, next]);
                        }
                        visible_len += line_length.default(tmp_line);
                    } else if (intersection.features.length == 2) {
                        tmp_line = turf.lineString([intersection.features[0].geometry.coordinates, intersection.features[1].geometry.coordinates]);
                        visible_len += line_length.default(tmp_line);
                    }
                }
            }
        }
    }

    return visible_len;
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
            if (result.length > 0) {
                //tmp = result.reverse();
                tmp.push(result[result.length - 1]);
                tmp.push(result[0]);
            }
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

function isObjEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function getMuliLineStringCoords(coords) {
    var new_coords = [];

    for (var i = 0; i < coords.length; i++) {
        for (var j = 0; j < coords[i].length; j++) {
            new_coords.push(coords[i][j]);
        }
    }

    return new_coords;
}

function getAveragePolution(list) {
    var sum = 0, count = 0;
    for (var i in list) {
        if (list[i].polution > 0) {
            sum += list[i].polution;
            count++;
        }
        if (list[i].focus.length > 0)
            for (var j in list[i].focus) {
                sum += (list[i].focus[j].polution);
                count++;
            }
    }
    if (sum == 0) return 0;
    else {
        var avg = sum / count
        return Math.round(avg * 100) / 100;
    }
}

function getAverageRange(list) {
    var sum = 0, count = 0;
    for (var i in list) {
        if (list[i].range > 0) {
            sum += list[i].range;
            count++;
        }
        if (list[i].focus.length > 0)
            for (var j in list[i].focus) {
                sum += (list[i].focus[j].range);
                count++;
            }
    }
    if (sum == 0) return 0;
    else {
        var avg = sum / count
        return Math.round(avg * 100) / 100;
    }
}

//color-geometry calculations  --  Euclidean Distance
function pointToPointSquared(p1, p2) {
    var r_sub, g_sub, b_sub;
    r_sub = Math.pow((p1.r - p2.r), 2);
    g_sub = Math.pow((p1.g - p2.g), 2);
    b_sub = Math.pow((p1.b - p2.b), 2);

    return (r_sub + g_sub + b_sub);
}

function pointToLineDist(point, line_point_a, line_point_b) {
    var line_dist = pointToPointSquared(line_point_a, line_point_b);
    if (line_dist == 0) return pointToPointSquared(point, line_point_a);
    
    var t = ((point.r - line_point_a.r) * (line_point_b.r - line_point_a.r) +
        (point.g - line_point_a.g) * (line_point_b.g - line_point_a.g) +
        (point.b - line_point_a.b) * (line_point_b.b - line_point_a.b)) / line_dist;

    //constrain between 0-1
    if (t > 1)
        t = 1;
    else if (t < 0)
        t = 0;

    var final_dist = pointToPointSquared(point, {
        r: line_point_a.r + t * (line_point_b.r - line_point_a.r),
        g: line_point_a.g + t * (line_point_b.g - line_point_a.g),
        b: line_point_a.b + t * (line_point_b.b - line_point_a.b)
    });

    return {
        dist: Math.sqrt(final_dist),
        weight: t
    };
}
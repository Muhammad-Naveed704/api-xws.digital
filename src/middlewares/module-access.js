const ModuleAcessModel = require("../models/Admin-models/module-access.model");
const UserModel = require("../models/user.model");
const EmployeeModel = require("../models/Admin-models/employee/employee.model");
const { roles } = require("../utils/constants");
const { sendErrorResponse } = require("../utils/response");

module.exports = (moduleNames, actionType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new Error("User not authenticated or req.user missing");
      }
      const { _id: userId, role, type, roleId } = req.user;

      // console.log("User:", { userId, role, type, roleId: roleId?._id });
      // console.log("Module Names:", moduleNames);
      // console.log("Action Type:", actionType);
      // console.log("Request Path:", req.path);
      

        if (role === "Admin") {
        return next();
      }

      let user, userRole;

      if (type === "employee") {
        user = await EmployeeModel.findById(userId).populate({
          path: "roleId",
          populate: {
            path: "permissions.menuId",
            select: "_id menuName menuCode url"
          }
        });
        if (!user) throw new Error("Employee not found");

        userRole = user.roleId && user.roleId.roleCode ? user.roleId.roleCode : null;
        if (!userRole) throw new Error("Employee role not found");

        const permissions = user.roleId?.permissions || [];
        // console.log("Permissions:", JSON.stringify(permissions, null, 2));

        const hasAccess = moduleNames.some((modName) => {
          const permission = permissions.find((perm) => {
            const menuCode = perm.menuId?.menuCode || "undefined";
            const match = menuCode === modName && perm.enabled;
            // console.log(`Checking module: ${modName}, MenuCode: ${menuCode}, MenuId: ${perm.menuId?._id}, Match: ${match}, Permission:`, perm);
            return match;
          });

          if (!permission) {
            // console.log(`No permission found for module: ${modName}`);
            return false;
          }

          const hasAction = permission.items.some((item) => {
            const actionAllowed = item[actionType] === true;
            // console.log(`Checking action: ${actionType}, Allowed: ${actionAllowed}, Item:`, item);
            return actionAllowed;
          });

          return hasAction;
        });

        if (!hasAccess) {
          // console.log(`Access denied for ${actionType} on ${moduleNames.join(", ")}`);
          throw new Error(`You are not authorized to perform this operation${actionType} `);
        }

        console.log("Access granted for employee");
        return next();
      }

      user = await UserModel.findById(userId);
      if (!user) {
        user = await EmployeeModel.findById(userId).populate({
          path: "roleId",
          populate: {
            path: "permissions.menuId",
            select: "_id menuName menuCode url"
          }
        });
        if (!user) throw new Error("User not found");
      }

      userRole = user.role || (user.roleId && user.roleId.roleCode) || null;
      if (!userRole) throw new Error("User role not found");

      // console.log("User Role:", userRole);

      if (userRole === roles.admin) {
        // console.log("Admin access granted");
        return next();
      }

      if (userRole === roles.subAdmin) {
        const findModuleAccess = await ModuleAcessModel.findById(user.moduleAccessId).lean();
        // console.log("Module Access:", JSON.stringify(findModuleAccess, null, 2));
        if (!findModuleAccess) {
          throw new Error("Module access not found for subAdmin");
        }
        const hasAccess = moduleNames.some((modName) => {
          const module = findModuleAccess[modName];
          const accessGranted = module && module[actionType] === true;
          // console.log(`SubAdmin module: ${modName}, Access: ${accessGranted}, Module:`, module);
          return accessGranted;
        });

        if (hasAccess) {
          // console.log("Access granted for subAdmin");
          return next();
        } else {
          throw new Error("You are not authorized to perform this operation");
        }
      }

      throw new Error("You are not authorized to perform this operation");
    } catch (error) {
      // console.error("Permission Middleware Error:", error.message);
      sendErrorResponse(res, error.message, 403);
    }
  };
};

<?php

return [
    'roles' => [
        'owner' => [
            'workspace.view',
            'workspace.manage_members',
            'products.write',
            'listings.publish',
            'mappings.write',
            'audit.view',
            'workspace.delete',
            'workspace.transfer_ownership',
        ],
        'admin' => [
            'workspace.view',
            'workspace.manage_members',
            'products.write',
            'listings.publish',
            'mappings.write',
            'audit.view',
        ],
        'manager' => [
            'workspace.view',
            'products.write',
            'listings.publish',
            'mappings.write',
            'audit.view',
            'workspace.invite_members',
        ],
        'content' => [
            'workspace.view',
            'products.write',
            'listings.publish',
        ],
        'viewer' => [
            'workspace.view',
            'audit.view',
        ],
    ],
];
